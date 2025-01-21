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
      apiVersion: '2024-12-18.acacia',
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkUsersAndGenerateBoletos() {
    this.logger.log('Iniciando verificação diária de usuários e cobranças');

    try {
      const usersEndingTrial = await this.usersService.getUsersEndingTrial();
      await this.generateBoletosForUsers(usersEndingTrial);

      const usersForRegularBilling =
        await this.usersService.getUsersForRegularBilling();
      await this.generateBoletosForUsers(usersForRegularBilling);

      this.logger.log('Verificação diária finalizada');
    } catch (error) {
      this.logger.error('Erro na verificação diária:', error);
    }
  }

  private async generateBoletosForUsers(users: User[]) {
    for (const user of users) {
      try {
        const pendingPaymentSlip = await this.paymentModel.findOne({
          userId: user.id,
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.BOLETO,
        });

        if (pendingPaymentSlip) {
          this.logger.log(
            `Usuário ${user.id} já possui um boleto pendente. Pulando geração.`,
          );
          continue;
        }

        if (!user.document) {
          this.logger.error(
            `Usuário ${user.id} não possui CPF/CNPJ cadastrado. Pulando geração.`,
          );
          continue;
        }

        const dueDate = addDays(new Date(), 7);

        const userCourt = await this.courtService.findOneByOwnerId(user.id);

        if (!userCourt) {
          this.logger.error(
            `Usuário ${user.id} não possui quadra cadastrada. Pulando geração.`,
          );
          continue;
        }

        const subscriptionPlan = await this.subscriptionsService.getPlanById(
          String(user?.subscriptionId),
        );

        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: subscriptionPlan.price / 100,
          currency: 'brl',
          payment_method_types: ['boleto'],
          payment_method_options: {
            boleto: {
              expires_after_days: 7,
            },
          },
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
            userId: user.id,
            type: 'SUBSCRIPTION',
          },
        });

        const payment = await this.paymentModel.create({
          amount: subscriptionPlan.price / 100,
          userId: user.id,
          stripePaymentIntentId: paymentIntent.id,
          status: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.BOLETO,
          boletoUrl:
            paymentIntent.next_action?.boleto_display_details
              ?.hosted_voucher_url,
          boletoPdf: paymentIntent.next_action?.boleto_display_details?.pdf,
          boletoExpirationDate: dueDate,
        });

        await this.resendService.sendPaymentNotification(
          user.email,
          user.firstName,
          payment.amount,
          payment.boletoExpirationDate,
          payment.boletoUrl,
        );

        await this.usersService.updateUser(user.id, {
          lastBillingDate: new Date(),
          nextBillingDate: addDays(new Date(), 30),
        });

        this.logger.log(`Boleto gerado para proprietário ${user.id}`);
      } catch (error) {
        this.logger.error(
          `Erro ao gerar boleto para usuário ${user.id}:`,
          error,
        );
      }
    }
  }
}
