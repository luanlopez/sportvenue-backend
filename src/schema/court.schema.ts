import { Schema, Document } from 'mongoose';
import { CourtAmenities } from '../modules/court/enums/court-amenities.enum';
import { CourtCategories } from '../modules/court/enums/court-categories.enum';

export interface WeeklySchedule {
  monday?: string[];
  tuesday?: string[];
  wednesday?: string[];
  thursday?: string[];
  friday?: string[];
  saturday?: string[];
  sunday?: string[];
}

export interface Court extends Document {
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  number: string;
  ownerId: Schema.Types.ObjectId;
  weeklySchedule: WeeklySchedule;
  reason?: string;
  pricePerHour: number;
  amenities: CourtAmenities[];
  categories: CourtCategories[];
  images: string[];
  status?: boolean;
  createdAt: Date;
  updatedAt: Date;
  postalCode: string;
  state: string;
}

export const CourtSchema = new Schema<Court>(
  {
    address: {
      type: String,
      required: true,
    },
    description: {
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
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    images: [String],
    status: {
      type: Boolean,
      required: false,
    },
    reason: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    amenities: {
      type: [String],
      required: true,
    },
    categories: {
      type: [String],
      required: true,
    },
    weeklySchedule: {
      monday: [String],
      tuesday: [String],
      wednesday: [String],
      thursday: [String],
      friday: [String],
      saturday: [String],
      sunday: [String],
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);
