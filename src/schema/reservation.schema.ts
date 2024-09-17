import { Schema, Document } from 'mongoose';

export interface Reservation extends Document {
  ownerId: string;
  userId: string;
  courtId: string;
  reservedTime: {
    start: Date;
    end: Date;
  };
  status: 'requested' | 'approved' | 'rejected' | 'cancelled';
}

export const ReservationSchema = new Schema<Reservation>(
  {
    ownerId: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    courtId: {
      type: Schema.Types.String,
      required: true,
      trim: true,
    },
    reservedTime: {
      start: {
        type: Schema.Types.Date,
        required: true,
      },
      end: {
        type: Schema.Types.Date,
        required: true,
      },
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
