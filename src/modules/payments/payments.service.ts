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

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
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

  async handleWebhook(signature: string, payload: Buffer) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET'),
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.updatePaymentStatus(paymentIntent.id, PaymentStatus.PAID);
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await this.updatePaymentStatus(
            failedPayment.id,
            PaymentStatus.EXPIRED,
          );
          break;
      }

      return { received: true };
    } catch (error) {
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
}
