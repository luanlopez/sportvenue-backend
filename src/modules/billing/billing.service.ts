import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BillingStatus, CreateBillingDTO } from './dtos/create-billing.dto';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ApiMessages } from 'src/common/messages/api-messages';
import { ErrorCodes } from 'src/common/errors/error-codes';
import { Billing } from 'src/schema/billing.schema';
import { UpdateBillingDTO } from './dtos/update-billing.dto';
import { Invoice, PaymentMethod } from 'src/schema/invoice.schema';

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
        updateData.paidAt = new Date();
      }

      const updatedBilling = await this.billingModel.findByIdAndUpdate(
        billingId,
        updateData,
        { new: true },
      );

      const invoice = await this.invoiceModel.findOne({
        billingId: billing._id,
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
}
