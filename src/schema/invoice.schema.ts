import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BillingStatus } from 'src/modules/billing/dtos/create-billing.dto';

export type InvoiceDocument = Invoice & Document;

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_SLIP = 'BANK_SLIP',
  PIX = 'PIX',
  IN_PERSON = 'IN_PERSON',
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Billing',
    required: true,
  })
  billingId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  ownerId: string;

  @Prop({
    type: String,
    enum: BillingStatus,
    required: true,
  })
  status: BillingStatus;

  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: Date,
    required: true,
    default: Date.now,
  })
  paidAt: Date;

  @Prop({
    type: String,
    required: false,
  })
  notes?: string;

  @Prop({
    type: Number,
    required: true,
  })
  amount: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Reservation',
    required: true,
  })
  reservationId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Court',
    required: true,
  })
  courtId: string;

  @Prop({
    type: String,
    required: false,
  })
  invoiceNumber?: string;

  @Prop({
    type: Object,
    required: false,
  })
  metadata?: Record<string, any>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
