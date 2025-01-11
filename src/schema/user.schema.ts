import { Schema, Document, model } from 'mongoose';

export enum UserType {
  USER = 'USER',
  HOUSE_OWNER = 'HOUSE_OWNER',
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
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<User>('User', UserSchema);
