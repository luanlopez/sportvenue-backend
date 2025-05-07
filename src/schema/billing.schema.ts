import { Schema, Document } from 'mongoose';
import {
  BillingStatus,
  BillingType,
} from 'src/modules/billing/dtos/create-billing.dto';

export interface Billing extends Document {
  reservationId: Schema.Types.ObjectId;
  ownerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  courtId: Schema.Types.ObjectId;
  amount: number;
  billingType: BillingType;
  status: BillingStatus;
}

export const BillingSchema = new Schema<Billing>(
  {
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
    },
    courtId: {
      type: Schema.Types.ObjectId,
      ref: 'Court',
      required: true,
    },
    amount: {
      type: Schema.Types.Number,
      required: true,
    },
    billingType: {
      type: String,
      required: true,
      enum: [BillingType.PRESENCIAL, BillingType.ONLINE],
    },
    status: {
      type: Schema.Types.String,
      enum: [
        BillingStatus.PAGO_PRESENCIALMENTE,
        BillingStatus.PAGO_SPORTMAP,
        BillingStatus.PENDING,
      ],
      default: BillingStatus.PENDING,
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default BillingSchema;
