import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stripe } from 'stripe';
import {
  Subscription,
  SubscriptionStatus,
} from '../../schema/subscription.schema';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { PlanService } from '../plan/plan.service';
import { UsersService } from '../users/users.service';
import { CourtService } from '../court/court.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { BillingHistoryDto } from './dto/billing-history.dto';
import { InvoiceDetailsDto } from './dto/invoice-details.dto';
import { BillingHistoryQueryDto } from './dto/billing-history-query.dto';
import { PaginatedBillingHistoryDto } from './dto/paginated-billing-history.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscriptionInfoDto } from './dto/subscription-info.dto';
import { UserType } from 'src/schema/user.schema';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectModel('Subscription')
    private subscriptionModel: Model<Subscription>,
    @Inject(forwardRef(() => PlanService))
    private planService: PlanService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => CourtService))
    private courtService: CourtService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  /**
   * Cria uma nova assinatura
   * @param createSubscriptionDto Dados da assinatura
   * @returns Assinatura criada
   */
  async create(createSubscriptionDto: CreateSubscriptionDto) {
    try {
      const { userId, planId, sessionId } = createSubscriptionDto;

      const user = await this.usersService.getUserById(userId);
      if (!user) {
        throw new CustomApiError(
          'Usuário não encontrado',
          'Usuário não encontrado',
          'USER_NOT_FOUND',
          404,
        );
      }

      const plan = await this.planService.getPlanById(planId);
      if (!plan) {
        throw new CustomApiError(
          'Plano não encontrado',
          'Plano não encontrado',
          'PLAN_NOT_FOUND',
          404,
        );
      }

      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (!session) {
        throw new CustomApiError(
          'Sessão da Stripe não encontrada',
          'Sessão da Stripe não encontrada',
          'STRIPE_SESSION_NOT_FOUND',
          404,
        );
      }

      const customer = await this.stripe.customers.retrieve(
        session.customer as string,
      );

      if (!customer || customer.deleted) {
        throw new CustomApiError(
          'Customer não encontrado',
          'Customer não encontrado na Stripe',
          'STRIPE_CUSTOMER_NOT_FOUND',
          404,
        );
      }

      const subscriptions = await this.stripe.subscriptions.list({
        customer: customer.id,
        status: 'trialing',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        throw new CustomApiError(
          'Subscription ativa não encontrada na Stripe',
          'Subscription ativa não encontrada na Stripe',
          'STRIPE_SUBSCRIPTION_NOT_FOUND',
          404,
        );
      }

      const stripeSubscription = subscriptions.data[0];

      const subscription = new this.subscriptionModel({
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        status: 'trialing',
        sessionId,
      });

      await this.usersService.updateUser(userId, {
        stripeCustomerId: customer.id,
        subscriptionId: subscription,
        userType: UserType.HOUSE_OWNER,
      });

      return await subscription.save();
    } catch (error) {
      console.log(error);
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new CustomApiError(
        'Erro ao criar subscription',
        `Erro ao criar subscription: ${error.message}`,
        'SUBSCRIPTION_CREATE_ERROR',
        500,
      );
    }
  }

  /**
   * Busca o histórico de cobrança da subscription com filtros e paginação
   * @param userId ID do usuário
   * @param query Parâmetros de query (paginação, filtros)
   * @returns Histórico de cobrança paginado
   */
  async getBillingHistory(
    userId: string,
    query: BillingHistoryQueryDto,
  ): Promise<PaginatedBillingHistoryDto> {
    try {
      const user = await this.usersService.getUserById(userId);

      if (!user) {
        throw new CustomApiError(
          'Usuário não encontrado',
          'Usuário não encontrado',
          'USER_NOT_FOUND',
          404,
        );
      }

      const subscription = await this.subscriptionModel.findOne({
        userId: user._id,
        _id: user.subscriptionId,
      });

      if (!subscription) {
        throw new CustomApiError(
          'Subscription não encontrada',
          'Subscription não encontrada para este usuário',
          'SUBSCRIPTION_NOT_FOUND',
          404,
        );
      }

      const stripeParams: any = {
        subscription: subscription.stripeSubscriptionId,
        limit: query.limit || 10,
      };

      if (query.status) {
        stripeParams.status = query.status;
      }
      if (query.startDate || query.endDate) {
        stripeParams.created = {};
        if (query.startDate) {
          stripeParams.created.gte = Math.floor(
            new Date(query.startDate).getTime() / 1000,
          );
        }
        if (query.endDate) {
          stripeParams.created.lte = Math.floor(
            new Date(query.endDate).getTime() / 1000,
          );
        }
      }
      const invoices = await this.stripe.invoices.list(stripeParams);

      const billingHistory: BillingHistoryDto = {
        subscription: {
          id: subscription._id.toString(),
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: subscription.status,
          user: subscription.userId as any,
          plan: subscription.planId as any,
        },
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          paid: invoice.paid,
          paymentMethod: invoice.payment_intent ? 'card' : 'boleto',
        })),
      };

      const result: PaginatedBillingHistoryDto = {
        data: billingHistory,
        page: query.page || 1,
        limit: query.limit || 10,
        total: invoices.data.length,
        totalPages: Math.ceil(invoices.data.length / (query.limit || 10)),
        hasPrevious: query.page > 1,
        hasNext:
          query.page < Math.ceil(invoices.data.length / (query.limit || 10)),
      };

      return result;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new CustomApiError(
        'Erro ao buscar histórico de cobrança',
        `Erro ao buscar histórico de cobrança: ${error.message}`,
        'BILLING_HISTORY_ERROR',
        500,
      );
    }
  }

  async updateSubscriptionStatus(stripeSubscriptionId: string, status: string) {
    const subscription = await this.subscriptionModel.findOne({
      stripeSubscriptionId,
    });

    if (!subscription) {
      return null;
    }

    await this.subscriptionModel.findByIdAndUpdate(subscription._id, {
      status,
    });

    if (status === SubscriptionStatus.CANCELED) {
      await this.usersService.updateUser(subscription.userId.toString(), {
        subscriptionId: null,
        userType: UserType.USER,
      });
    }

    return subscription;
  }

  /**
   * Busca detalhes de uma invoice específica
   * @param invoiceId ID da invoice no Stripe
   * @returns Detalhes da invoice
   */
  async getInvoiceDetails(invoiceId: string): Promise<InvoiceDetailsDto> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);

      if (!invoice) {
        throw new CustomApiError(
          'Invoice não encontrada',
          'Invoice não encontrada no Stripe',
          'INVOICE_NOT_FOUND',
          404,
        );
      }

      const invoiceDetails: InvoiceDetailsDto = {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        created: invoice.created,
        dueDate: invoice.due_date,
        paidAt:
          invoice.status === 'paid'
            ? invoice.status_transitions?.paid_at
            : undefined,
        description: invoice.description,
        subscription: invoice.subscription as string,
        customer: invoice.customer as string,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
      };

      return invoiceDetails;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new CustomApiError(
        'Erro ao buscar detalhes da invoice',
        `Erro ao buscar detalhes da invoice: ${error.message}`,
        'INVOICE_DETAILS_ERROR',
        500,
      );
    }
  }

  /**
   * Cancela uma subscription no final do período atual
   * @param userId ID do usuário
   * @param cancelSubscriptionDto Dados para cancelamento
   * @returns Subscription cancelada
   */
  async cancelSubscription(
    userId: string,
    cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    try {
      const { confirm } = cancelSubscriptionDto;

      if (!confirm) {
        throw new CustomApiError(
          'Confirmação necessária',
          'É necessário confirmar o cancelamento da subscription',
          'CONFIRMATION_REQUIRED',
          400,
        );
      }

      const user = await this.usersService.getUserById(userId);
      if (!user) {
        throw new CustomApiError(
          'Usuário não encontrado',
          'Usuário não encontrado',
          'USER_NOT_FOUND',
          404,
        );
      }

      const subscription = await this.subscriptionModel.findOne({
        userId: user._id,
      });

      if (!subscription) {
        throw new CustomApiError(
          'Subscription não encontrada',
          'Subscription não encontrada para este usuário',
          'SUBSCRIPTION_NOT_FOUND',
          404,
        );
      }

      if (subscription.status === 'canceled') {
        throw new CustomApiError(
          'Subscription já cancelada',
          'Esta subscription já foi cancelada',
          'SUBSCRIPTION_ALREADY_CANCELED',
          400,
        );
      }

      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      );

      await this.subscriptionModel.findByIdAndUpdate(subscription._id, {
        status: 'active',
      });

      return {
        message: 'Subscription será cancelada no final do período atual',
        subscription: {
          id: subscription._id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: 'active',
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000)
            : null,
        },
      };
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new CustomApiError(
        'Erro ao cancelar subscription',
        `Erro ao cancelar subscription: ${error.message}`,
        'SUBSCRIPTION_CANCEL_ERROR',
        500,
      );
    }
  }

  /**
   * Busca informações detalhadas da subscription do usuário
   * @param userId ID do usuário
   * @returns Informações detalhadas da subscription
   */
  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfoDto> {
    try {
      const subscription = await this.subscriptionModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!subscription) {
        throw new CustomApiError(
          'Subscription não encontrada',
          'Subscription não encontrada para este usuário',
          'SUBSCRIPTION_NOT_FOUND',
          404,
        );
      }

      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      const paymentMethod = await this.stripe.paymentMethods.retrieve(
        stripeSubscription.default_payment_method as string,
      );

      console.log(paymentMethod);

      const plan = await this.planService.getPlanById(
        subscription.planId.toString(),
      );

      if (!plan) {
        throw new CustomApiError(
          'Plano não encontrado',
          'Plano não encontrado',
          'PLAN_NOT_FOUND',
          404,
        );
      }

      const courtCount = await this.courtService.countCourtsByOwner(userId);

      const subscriptionInfo: SubscriptionInfoDto = {
        id: subscription._id.toString(),
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        status: subscription.status,
        plan: {
          id: plan._id.toString(),
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: 'BRL',
          courtLimit: plan.courtLimit,
          features: [plan.type],
        },
        courtUsage: {
          totalCreated: courtCount,
          limit: plan.courtLimit,
          available: Math.max(0, plan.courtLimit - courtCount),
        },
        billing: {
          currentPeriodStart: new Date(
            stripeSubscription.current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            stripeSubscription.current_period_end * 1000,
          ),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          cancelAt: stripeSubscription.cancel_at
            ? new Date(stripeSubscription.cancel_at * 1000)
            : undefined,
          amount: stripeSubscription.items.data[0]?.price?.unit_amount
            ? stripeSubscription.items.data[0].price.unit_amount / 100
            : 0,
          currency: stripeSubscription.currency,
        },
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        paymentMethod: {
          id: paymentMethod.id,
          brand: paymentMethod.card?.brand || 'unknown',
          last4: paymentMethod.card?.last4 || 'unknown',
        },
      };

      return subscriptionInfo;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new CustomApiError(
        'Erro ao buscar informações da subscription',
        `Erro ao buscar informações da subscription: ${error.message}`,
        'SUBSCRIPTION_INFO_ERROR',
        500,
      );
    }
  }

  /**
   * Reativa uma subscription
   * @param userId ID do usuário
   * @param reactivateSubscriptionDto Dados para reativação
   * @returns Subscription reativada
   */
  async reactivateSubscription(userId: string) {
    try {
      const user = await this.usersService.getUserById(userId);
      if (!user) {
        throw new CustomApiError(
          'Usuário não encontrado',
          'Usuário não encontrado',
          'USER_NOT_FOUND',
          404,
        );
      }

      const subscription = await this.subscriptionModel.findOne({
        userId: user._id,
      });

      if (!subscription) {
        throw new CustomApiError(
          'Subscription não encontrada',
          'Subscription não encontrada para este usuário',
          'SUBSCRIPTION_NOT_FOUND',
          404,
        );
      }

      if (subscription.status === 'canceled') {
        throw new CustomApiError(
          'Subscription já cancelada',
          'Esta subscription já foi cancelada',
          'SUBSCRIPTION_ALREADY_CANCELED',
          400,
        );
      }

      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      return {
        message: 'Subscription reativada com sucesso',
        subscription: {
          id: subscription._id,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          status: 'active',
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000)
            : null,
        },
      };
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw new CustomApiError(
        'Erro ao cancelar subscription',
        `Erro ao cancelar subscription: ${error.message}`,
        'SUBSCRIPTION_CANCEL_ERROR',
        500,
      );
    }
  }
}
