import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BillingStatus } from './dtos/create-billing.dto';
import { Invoice, InvoiceDocument } from 'src/schema/invoice.schema';
import { Billing } from 'src/schema/billing.schema';

@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    @InjectModel('Billing') private billingModel: Model<Billing>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  async handleBillingGeneration() {
    this.logger.log('Starting billing generation cron job');

    try {
      const activeBillings = await this.billingModel
        .find({
          nextPaidAt: {
            $lte: new Date(),
          },
          status: { $ne: BillingStatus.PENDING },
        })
        .populate('userId')
        .populate('ownerId')
        .populate('courtId')
        .populate('reservationId')
        .sort({ nextPaidAt: 1 });

      this.logger.log(`Found ${activeBillings.length} billings to process`);

      for (const billing of activeBillings) {
        try {
          const invoiceNumber = `INV-${Date.now()}-${billing._id.toString().substring(0, 8)}`;

          await this.invoiceModel.create({
            billingId: billing._id,
            userId: billing.userId,
            ownerId: billing.ownerId,
            reservationId: billing.reservationId,
            courtId: billing.courtId,
            status: BillingStatus.PENDING,
            paymentMethod: 'IN_PERSON',
            amount: billing.amount,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notes: 'Fatura gerada automaticamente',
            invoiceNumber,
            metadata: {
              automaticallyGenerated: true,
              billingType: billing.billingType,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });

          await this.billingModel.findByIdAndUpdate(billing._id, {
            status: BillingStatus.PENDING,
          });

          this.logger.log('Generated invoice and updated billing status', {
            billingId: billing._id,
            userId: billing.userId,
            nextPaidAt: billing.nextPaidAt,
          });
        } catch (error) {
          this.logger.error('Failed to process billing', {
            billingId: billing._id,
            error: error.message,
          });
        }
      }

      this.logger.log('Completed billing generation cron job');
    } catch (error) {
      this.logger.error('Failed to process billings', {
        error: error.message,
      });
    }
  }
}
