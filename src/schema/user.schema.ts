import { Schema, Document, model } from 'mongoose';
import { SubscriptionPlan } from './subscription-plan.schema';

export enum UserType {
  USER = 'USER',
  HOUSE_OWNER = 'HOUSE_OWNER',
}

export enum PlanType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  userType?: UserType;
  phone?: string;
  googleId?: string;
  picture?: string;
  lastBillingDate?: Date;
  nextBillingDate?: Date;
  trialEndsAt?: Date;
  document?: string;
  subscriptionId?: SubscriptionPlan;
}

export const UserSchema = new Schema<User>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: { type: String, required: false, trim: true },
    userType: {
      type: String,
      enum: Object.values(UserType),
      required: false,
    },
    googleId: {
      type: String,
      required: false,
    },
    picture: {
      type: String,
      required: false,
    },
    lastBillingDate: { type: Date, required: false },
    nextBillingDate: { type: Date, required: false },
    trialEndsAt: { type: Date, required: false },
    document: {
      type: String,
      required: false,
      trim: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<User>('User', UserSchema);
