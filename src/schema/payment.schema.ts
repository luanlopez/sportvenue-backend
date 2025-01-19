import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  PIX = 'pix',
  BOLETO = 'boleto',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  amount: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string;

  @Prop({ required: true })
  stripePaymentIntentId: string;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop()
  boletoUrl?: string;

  @Prop()
  boletoPdf?: string;

  @Prop()
  boletoExpirationDate?: Date;

  @Prop()
  pixQrCode?: string;

  @Prop()
  pixQrCodeUrl?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
