import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BillingStatus,
  BillingType,
  CreateBillingDTO,
} from './dtos/create-billing.dto';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { Billing } from 'src/schema/billing.schema';
import { UpdateBillingDTO } from './dtos/update-billing.dto';
import { Invoice, PaymentMethod } from 'src/schema/invoice.schema';

interface GetInvoicesFilters {
  page?: number;
  limit?: number;
  status?: BillingStatus;
  paymentMethod?: BillingType;
  createdAtStart?: Date;
  createdAtEnd?: Date;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectModel('Billing')
    private readonly billingModel: Model<Billing>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<Invoice>,
  ) {}

  /**
   * Cria uma nova cobrança (billing)
   *
   * @param createBillingDto DTO contendo os dados da cobrança
   * @returns A cobrança criada
   */
  async createBilling(createBillingDto: CreateBillingDTO) {
    try {
      const newBilling = await this.billingModel.create({
        ...createBillingDto,
        status: BillingStatus.PENDING,
      });

      const invoiceNumber = `INV-${Date.now()}-${newBilling._id.toString().substring(0, 8)}`;

      await this.invoiceModel.create({
        billingId: newBilling._id,
        userId: createBillingDto.userId,
        ownerId: createBillingDto.ownerId,
        status: BillingStatus.PENDING,
        paymentMethod: PaymentMethod.IN_PERSON,
        paidAt: null,
        notes: 'Fatura gerada automaticamente',
        amount: createBillingDto.amount,
        reservationId: createBillingDto.reservationId,
        courtId: createBillingDto.courtId,
        invoiceNumber: invoiceNumber,
        metadata: {
          automaticallyGenerated: true,
          billingType: createBillingDto.billingType,
          dueDate: createBillingDto.dueDate,
        },
      });

      return newBilling;
    } catch (error) {
      console.log(error);
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  /**
   * Obtém as cobranças de um proprietário específico
   *
   * @param ownerId ID do proprietário da quadra
   * @param page Número da página a ser retornada
   * @param limit Número de itens por página
   * @param status Status opcional para filtrar as cobranças
   * @returns Um objeto contendo os dados das cobranças e o total de registros
   */
  async getBillingsByOwner(
    ownerId: string,
    {
      page = 1,
      limit = 10,
      status,
    }: { page?: number; limit?: number; status?: BillingStatus },
  ) {
    try {
      const query = { ownerId, ...(status && { status }) };

      const [data, total] = await Promise.all([
        this.billingModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId')
          .populate('courtId')
          .populate('reservationId')
          .sort({ createdAt: -1 })
          .exec(),
        this.billingModel.countDocuments(query).exec(),
      ]);

      return { data, total };
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
   * Obtém as cobranças de um usuário específico
   *
   * @param userId ID do usuário a ser filtrado
   * @param page Número da página a ser retornada
   * @param limit Número de itens por página
   * @param status Status opcional para filtrar as cobranças
   * @returns Um objeto contendo os dados das cobranças e o total de registros
   */
  async getBillingsByUser(
    userId: string,
    {
      page = 1,
      limit = 10,
      status,
    }: { page?: number; limit?: number; status?: BillingStatus },
  ) {
    try {
      const query = { userId, ...(status && { status }) };

      const [data, total] = await Promise.all([
        this.billingModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('courtId')
          .populate('reservationId')
          .sort({ createdAt: -1 })
          .exec(),
        this.billingModel.countDocuments(query).exec(),
      ]);

      return { data, total };
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
   * Atualiza o status de uma cobrança (billing)
   *
   * @param ownerId ID do proprietário da quadra
   * @param billingId ID da cobrança a ser atualizada
   * @param updateDto DTO contendo o novo status e metadados opcionais
   * @returns A cobrança atualizada
   */
  async updateBillingStatus(
    ownerId: string,
    billingId: string,
    updateDto: UpdateBillingDTO,
  ) {
    try {
      const billing = await this.billingModel.findById(billingId);

      if (!billing) {
        throw new CustomApiError(
          'Cobrança não encontrada',
          'A cobrança especificada não foi encontrada',
          ErrorCodes.BILLING_NOT_FOUND,
          404,
        );
      }

      if (billing.ownerId.toString() !== ownerId) {
        throw new CustomApiError(
          'Acesso negado',
          'Você não tem permissão para atualizar esta cobrança',
          ErrorCodes.UNAUTHORIZED,
          403,
        );
      }

      const updateData: any = {
        status: updateDto.status,
      };

      if (
        updateDto.status === BillingStatus.PAGO_PRESENCIALMENTE ||
        updateDto.status === BillingStatus.PAGO_SPORTMAP
      ) {
        const now = new Date();

        updateData.lastPaidAt = now;

        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        updateData.nextPaidAt = nextMonth;

        const newDueDate = new Date(nextMonth);
        newDueDate.setDate(newDueDate.getDate() + 3);
        updateData.dueDate = newDueDate;
      }

      const updatedBilling = await this.billingModel.findByIdAndUpdate(
        billingId,
        updateData,
        { new: true },
      );

      const invoice = await this.invoiceModel.findOne({
        billingId: billing._id,
        status: BillingStatus.PENDING,
      });

      if (invoice) {
        await this.invoiceModel.findByIdAndUpdate(invoice._id, {
          status: updateDto.status,
          paidAt:
            updateDto.status === BillingStatus.PAGO_PRESENCIALMENTE ||
            updateDto.status === BillingStatus.PAGO_SPORTMAP
              ? new Date()
              : null,
          notes: invoice.notes,
          metadata: {
            ...invoice.metadata,
            ...updateDto.metadata,
            lastUpdated: new Date(),
            updatedBy: ownerId,
          },
        });
      }

      return updatedBilling;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  /**
   * Obtém todas as cobranças relacionadas a uma reserva específica
   *
   * @param reservationId ID da reserva para filtrar as cobranças
   * @param page Número da página a ser retornada
   * @param limit Número de itens por página
   * @param status Status opcional para filtrar as cobranças
   * @returns Um objeto contendo os dados das cobranças e o total de registros
   */
  async getBillingsByReservation(
    userId: string,
    reservationId: string,
    {
      page = 1,
      limit = 10,
      status,
    }: { page?: number; limit?: number; status?: BillingStatus },
  ) {
    try {
      const query = { reservationId, ...(status && { status }) };

      const [data, total] = await Promise.all([
        this.billingModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId')
          .populate('ownerId')
          .populate('courtId')
          .sort({ createdAt: -1 })
          .exec(),
        this.billingModel.countDocuments(query).exec(),
      ]);

      return { data, total };
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  /**
   * Obtém todas as faturas relacionadas a uma cobrança específica
   *
   * @param userId ID do usuário fazendo a solicitação
   * @param billingId ID da cobrança para filtrar as faturas
   * @param page Número da página a ser retornada
   * @param limit Número de itens por página
   * @param status Status opcional para filtrar as faturas
   * @param paymentMethod Método de pagamento opcional para filtrar as faturas
   * @param createdAtStart Data inicial opcional para filtrar as faturas
   * @param createdAtEnd Data final opcional para filtrar as faturas
   * @returns Um objeto contendo os dados das faturas e o total de registros
   */
  async getInvoicesByBillingId(
    userId: string,
    billingId: string,
    {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      createdAtStart,
      createdAtEnd,
    }: GetInvoicesFilters,
  ) {
    try {
      const billing = await this.billingModel.findById(billingId);

      if (!billing) {
        throw new CustomApiError(
          'Cobrança não encontrada',
          'A cobrança especificada não foi encontrada',
          ErrorCodes.BILLING_NOT_FOUND,
          404,
        );
      }

      if (
        billing.ownerId.toString() !== userId &&
        billing.userId.toString() !== userId
      ) {
        throw new CustomApiError(
          'Acesso negado',
          'Você não tem permissão para visualizar as faturas desta cobrança',
          ErrorCodes.UNAUTHORIZED,
          403,
        );
      }

      const query = {
        billingId,
        ...(status && { status }),
        ...(paymentMethod && { paymentMethod }),
        ...((createdAtStart || createdAtEnd) && {
          createdAt: {
            ...(createdAtStart && { $gte: createdAtStart }),
            ...(createdAtEnd && { $lte: createdAtEnd }),
          },
        }),
      };

      const [data, total] = await Promise.all([
        this.invoiceModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'firstName lastName email')
          .populate('ownerId', 'firstName lastName email')
          .populate('courtId', 'name location')
          .populate('reservationId')
          .sort({ createdAt: -1 })
          .exec(),
        this.invoiceModel.countDocuments(query).exec(),
      ]);

      return { data, total };
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }

      throw new CustomApiError(
        ApiMessages.Payment.Failed.title,
        ApiMessages.Payment.Failed.message,
        ErrorCodes.PAYMENT_FAILED,
        400,
      );
    }
  }

  /**
   * Obtém todas as cobranças com um status específico
   *
   * @param status Status para filtrar as cobranças
   * @returns Lista de cobranças com o status especificado
   */
  async getBillingsByStatus(status: BillingStatus) {
    try {
      return this.billingModel
        .find({ status })
        .populate('userId')
        .populate('ownerId')
        .populate('courtId')
        .populate('reservationId')
        .sort({ createdAt: -1 })
        .exec();
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
