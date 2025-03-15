import { Schema, Document } from 'mongoose';

export interface VerificationCode extends Document {
  email: string;
  code: string;
  type?: 'REGISTRATION' | 'RESET_PASSWORD';
  expiresAt: Date;
  isUsed: boolean;
  userData?: {
    firstName: string;
    lastName: string;
    userType: string;
    phone: string;
    password: string;
    planID: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const VerificationCodeSchema = new Schema<VerificationCode>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['REGISTRATION', 'RESET_PASSWORD'],
      required: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    userData: {
      type: {
        firstName: String,
        lastName: String,
        userType: {
          type: String,
          required: false,
        },
        phone: String,
        password: String,
        planID: {
          type: String,
          required: false,
        },
      },
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export default VerificationCodeSchema;
