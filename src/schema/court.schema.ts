import { Schema, Document } from 'mongoose';

export interface Court extends Document {
  address: string;
  owner_id: string;
  name: string;
  availableHours: string[];
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
  status?: boolean;
  reason?: string;
  neighborhood: string;
  city: string;
  number: string;
}

export const CourtSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  neighborhood: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  owner_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  availableHours: [String],
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    required: false,
  },
  reason: {
    type: String,
    required: false,
  },
});
