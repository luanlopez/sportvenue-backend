import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { CreatePaymentIntentDTO } from './dtos/create-payment-intent.dto';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from '../../schema/payment.schema';
import { User } from 'src/schema/user.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'src/schema/notification.schema';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel('User') private userModel: Model<User>,
    private subscriptionsService: SubscriptionsService,
    private notificationService: NotificationService,
  ) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createPaymentIntent(data: CreatePaymentIntentDTO) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount * 100,
        currency: 'brl',
        payment_method_types: ['card'],
        metadata: {
          reservationId: data.reservationId,
          courtId: data.courtId,
          userId: data.userId,
        },
      });

      await this.paymentModel.create({
        amount: data.amount,
        reservationId: data.reservationId,
        courtId: data.courtId,
        userId: data.userId,
        stripePaymentIntentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.BOLETO,
      });

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  async handleWebhook(signature: string, body: any) {
    try {
      const event = body;

      console.log('Webhook event received:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.updatePaymentStatus(paymentIntent.id, PaymentStatus.PAID);
          await this.sendPaymentSuccessNotification(paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await this.updatePaymentStatus(
            failedPayment.id,
            PaymentStatus.EXPIRED,
          );
          await this.sendPaymentFailedNotification(failedPayment);
          break;

        case 'invoice.paid':
          const paidInvoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaid(paidInvoice);
          await this.sendSubscriptionPaymentSuccessNotification(paidInvoice);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionDeleted(deletedSubscription);
          break;
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new CustomApiError(
        ApiMessages.Payment.WebhookFailed.title,
        ApiMessages.Payment.WebhookFailed.message,
        ErrorCodes.WEBHOOK_FAILED,
        400,
      );
    }
  }

  private async updatePaymentStatus(
    stripePaymentIntentId: string,
    status: PaymentStatus,
  ) {
    try {
      await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId },
        { status },
        { new: true },
      );
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  private async sendPaymentSuccessNotification(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    try {
      const { userId, reservationId, courtId } = paymentIntent.metadata;
      const amount = paymentIntent.amount / 100;

      await this.notificationService.createNotification({
        userId,
        title: 'Pagamento Aprovado',
        message: `Seu pagamento de R$ ${amount.toFixed(2)} foi processado com sucesso! Sua reserva foi confirmada.`,
        type: NotificationType.PAYMENT_SUCCESS,
        relatedEntityId: reservationId,
        relatedEntityType: 'reservation',
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount,
          courtId,
          reservationId,
        },
      });

      console.log(`Payment success notification sent for user: ${userId}`);
    } catch (error) {
      console.error('Error sending payment success notification:', error);
    }
  }

  private async sendPaymentFailedNotification(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    try {
      const { userId, reservationId, courtId } = paymentIntent.metadata;
      const amount = paymentIntent.amount / 100;

      await this.notificationService.createNotification({
        userId,
        title: 'Pagamento Falhou',
        message: `O pagamento de R$ ${amount.toFixed(2)} não foi processado. Por favor, tente novamente ou entre em contato conosco.`,
        type: NotificationType.PAYMENT_FAILED,
        relatedEntityId: reservationId,
        relatedEntityType: 'reservation',
        metadata: {
          paymentIntentId: paymentIntent.id,
          amount,
          courtId,
          reservationId,
          failureReason:
            paymentIntent.last_payment_error?.message || 'Unknown error',
        },
      });

      console.log(`Payment failed notification sent for user: ${userId}`);
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }
  }

  private async sendSubscriptionPaymentSuccessNotification(
    invoice: Stripe.Invoice,
  ) {
    try {
      const customerId = invoice.customer as string;
      const amount = invoice.amount_paid / 100;
      const subscriptionId = invoice.subscription as string;

      const user = await this.getUserByStripeCustomerId(customerId);
      if (!user) {
        console.log(`User not found for Stripe customer: ${customerId}`);
        return;
      }

      await this.notificationService.createNotification({
        userId: user._id.toString(),
        title: 'Assinatura Paga com Sucesso',
        message: `Sua assinatura de R$ ${amount.toFixed(2)} foi processada com sucesso! Seu plano está ativo.`,
        type: NotificationType.PAYMENT_SUCCESS,
        relatedEntityId: subscriptionId,
        relatedEntityType: 'subscription',
        metadata: {
          invoiceId: invoice.id,
          subscriptionId,
          amount,
          customerId,
          invoiceNumber: invoice.number,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        },
      });

      console.log(
        `Subscription payment success notification sent for user: ${user._id}`,
      );
    } catch (error) {
      console.error(
        'Error sending subscription payment success notification:',
        error,
      );
    }
  }

  private async getUserByStripeCustomerId(stripeCustomerId: string) {
    try {
      return await this.userModel.findOne({ stripeCustomerId }).exec();
    } catch (error) {
      console.error('Error finding user by Stripe customer ID:', error);
      return null;
    }
  }

  async getUserBoletos(userId: string) {
    try {
      return this.paymentModel
        .find({
          userId,
          paymentMethod: PaymentMethod.BOLETO,
        })
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  /**
   * Verifica se há faturas pendentes para um proprietário específico
   *
   * @param ownerId ID do proprietário a ser verificado
   * @returns true se houver faturas pendentes, false caso contrário
   */
  async hasPendingPaymentsForUser(userId: string): Promise<boolean> {
    try {
      const pending = await this.paymentModel.exists({
        userId,
        status: 'EXPIRED',
      });
      return !!pending;
    } catch (error) {
      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    try {
      if (invoice.subscription) {
        await this.subscriptionsService.updateSubscriptionStatus(
          invoice.subscription as string,
          'active',
        );
      }
    } catch (error) {
      console.error('Error handling invoice paid:', error);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
      console.log('Handling subscription deleted:', subscription.id);

      await this.subscriptionsService.updateSubscriptionStatus(
        subscription.id,
        'canceled',
      );

      console.log('Subscription status updated to canceled:', subscription.id);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }
}
