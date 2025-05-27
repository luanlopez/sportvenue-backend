import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from '../../schema/payment.schema';
import { UsersService } from '../users/users.service';
import { addDays } from 'date-fns';
import { User } from '../../schema/user.schema';
import { ResendService } from '../common/resend/resend.service';
import { CourtService } from '../court/court.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsCronService {
  private readonly logger = new Logger(PaymentsCronService.name);
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private configService: ConfigService,
    private usersService: UsersService,
    private resendService: ResendService,
    private courtService: CourtService,
    private subscriptionsService: SubscriptionsService,
  ) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
    });
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkUsersAndGenerateBoletos() {
    this.logger.log('Starting hourly check for users requiring payment slips');

    try {
      const usersEndingTrial = await this.usersService.getUsersEndingTrial();
      this.logger.log(
        `Found ${usersEndingTrial.length} users ending trial period`,
      );
      await this.generateBoletosForUsers(usersEndingTrial);

      const usersForRegularBilling =
        await this.usersService.getUsersForRegularBilling();
      this.logger.log(
        `Found ${usersForRegularBilling.length} users needing regular billing`,
      );
      await this.generateBoletosForUsers(usersForRegularBilling);

      this.logger.log('Hourly check completed successfully');
    } catch (error) {
      this.logger.error('Error during hourly check:', error);
    }
  }

  private async generateBoletosForUsers(users: User[]) {
    this.logger.log(
      `Starting payment slip generation for ${users.length} users`,
    );

    for (const user of users) {
      try {
        const pendingPaymentSlip = await this.paymentModel.findOne({
          userId: user._id.toString(),
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.BOLETO,
        });

        if (pendingPaymentSlip) {
          this.logger.log(
            `Skipping user ${user._id.toString()}: already has pending payment slip`,
          );
          continue;
        }

        const expiredBoletos = await this.paymentModel.find({
          userId: user._id.toString(),
          paymentMethod: PaymentMethod.BOLETO,
          status: PaymentStatus.EXPIRED,
        });

        if (expiredBoletos.length > 0) {
          this.logger.log(
            `Skipping user ${user._id.toString()}: has ${expiredBoletos.length} expired boletos`,
          );
          continue;
        }

        if (!user.document) {
          this.logger.error(
            `Skipping user ${user._id.toString()}: missing CPF/CNPJ`,
          );
          continue;
        }

        const userCourt = await this.courtService.findOneByOwnerId(
          user._id.toString(),
        );

        if (!userCourt) {
          this.logger.error(
            `Skipping user ${user._id.toString()}: no registered court found`,
          );
          continue;
        }

        const subscriptionPlan = await this.subscriptionsService.getPlanById(
          String(user?.subscriptionId),
        );

        if (!subscriptionPlan) {
          this.logger.error(
            `Skipping user ${user._id.toString()}: no subscription plan found`,
          );
          continue;
        }

        const dueDate = addDays(new Date(), 7);

        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: subscriptionPlan.price,
          currency: 'brl',
          payment_method_types: ['boleto'],
          payment_method_data: {
            type: 'boleto',
            billing_details: {
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              address: {
                line1: userCourt.address,
                line2: '',
                city: userCourt.city,
                state: userCourt.state,
                postal_code: userCourt.postalCode,
                country: 'BR',
              },
            },
            boleto: {
              tax_id: user.document,
            },
          },
          metadata: {
            userId: user._id.toString(),
            type: 'SUBSCRIPTION',
          },
        });

        const confirmedIntent = await this.stripe.paymentIntents.confirm(
          paymentIntent.id,
          {
            payment_method_options: {
              boleto: {
                expires_after_days: 7,
              },
            },
          },
        );

        if (!confirmedIntent.next_action?.boleto_display_details) {
          throw new Error('Failed to generate boleto details');
        }

        const payment = await this.paymentModel.create({
          amount: subscriptionPlan.price,
          userId: user._id.toString(),
          stripePaymentIntentId: paymentIntent.id,
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.BOLETO,
          boletoUrl:
            confirmedIntent.next_action.boleto_display_details
              .hosted_voucher_url,
          boletoPdf: confirmedIntent.next_action.boleto_display_details.pdf,
          boletoBarCode:
            confirmedIntent.next_action.boleto_display_details.number,
          boletoExpirationDate: dueDate,
        });

        await this.resendService.sendPaymentNotification(
          user.email,
          user.firstName,
          payment.amount,
          payment.boletoExpirationDate,
          payment.boletoUrl,
        );

        await this.usersService.updateUser(user._id.toString(), {
          lastBillingDate: new Date(),
          nextBillingDate: addDays(new Date(), 30),
        });

        this.logger.log(
          `Payment slip generated successfully for user ${user._id.toString()}`,
        );
      } catch (error) {
        this.logger.error(
          `Error generating payment slip for user ${user._id.toString()}:`,
          error,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkPendingPayments() {
    this.logger.log('Iniciando verificação de pagamentos pendentes');

    try {
      const pendingPayments = await this.paymentModel.find({
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.BOLETO,
      });

      this.logger.log(
        `Encontrados ${pendingPayments.length} pagamentos pendentes`,
      );

      for (const payment of pendingPayments) {
        try {
          const paymentIntent = await this.stripe.paymentIntents.retrieve(
            payment.stripePaymentIntentId,
          );

          let newStatus = payment.status;
          const now = new Date();

          switch (paymentIntent.status) {
            case 'succeeded':
              newStatus = PaymentStatus.PAID;
              break;
            case 'canceled':
              newStatus = PaymentStatus.CANCELED;
              break;
            case 'requires_payment_method':
              if (
                payment.boletoExpirationDate &&
                payment.boletoExpirationDate < now
              ) {
                newStatus = PaymentStatus.EXPIRED;
              }
              break;
          }

          if (newStatus !== payment.status) {
            await this.paymentModel.findByIdAndUpdate(payment._id, {
              status: newStatus,
              updatedAt: now,
            });

            if (newStatus === PaymentStatus.PAID) {
              await this.usersService.updateUser(payment.userId, {
                lastBillingDate: now,
                nextBillingDate: addDays(now, 30),
              });

              const user = await this.usersService.findById(payment.userId);
              if (user) {
                await this.resendService.sendPaymentConfirmation(
                  user.email,
                  user.firstName,
                  payment.amount,
                );
              }
            }

            if (
              newStatus === PaymentStatus.EXPIRED ||
              newStatus === PaymentStatus.CANCELED
            ) {
              const user = await this.usersService.findById(payment.userId);
              if (user) {
                await this.resendService.sendPaymentFailureNotification(
                  user.email,
                  user.firstName,
                  payment.amount,
                  newStatus,
                );
              }
            }

            this.logger.log(
              `Pagamento ${payment._id} atualizado: ${payment.status} -> ${newStatus}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao processar pagamento ${payment._id}:`,
            error,
          );
        }
      }

      this.logger.log('Verificação de pagamentos pendentes finalizada');
    } catch (error) {
      this.logger.error('Erro na verificação de pagamentos pendentes:', error);
    }
  }
}
