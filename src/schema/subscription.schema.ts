import { Schema, Document } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing',
}

export interface Subscription extends Document {
  userId: Schema.Types.ObjectId;
  planId: Schema.Types.ObjectId;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  createdAt: Date;
  updatedAt: Date;
  sessionId: string;
}

export const SubscriptionSchema = new Schema<Subscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
      default: 'trialing',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default SubscriptionSchema;
