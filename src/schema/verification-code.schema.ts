import { Schema, Document } from 'mongoose';

export interface VerificationCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  userData: {
    firstName: string;
    lastName: string;
    userType: string;
    phone: string;
    password: string;
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
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    userData: {
      firstName: String,
      lastName: String,
      userType: String,
      phone: String,
      password: String,
    },
  },
  {
    timestamps: true,
  },
);

export default VerificationCodeSchema;
