import { Schema, Document } from 'mongoose';

export interface Reservation extends Document {
  ownerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  courtId: Schema.Types.ObjectId;
  reservedStartTime: string;
  status: 'requested' | 'approved' | 'rejected' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export const ReservationSchema = new Schema<Reservation>(
  {
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
    courtId: {
      type: Schema.Types.ObjectId,
      ref: 'Court',
      required: true,
    },
    reservedStartTime: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    status: {
      type: Schema.Types.String,
      enum: ['requested', 'approved', 'rejected', 'cancelled'],
      default: 'requested',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default ReservationSchema;
