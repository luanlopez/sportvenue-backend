import { Schema, Document, model } from 'mongoose';

export enum NotificationType {
  RESERVATION_REQUEST = 'RESERVATION_REQUEST',
  RESERVATION_APPROVED = 'RESERVATION_APPROVED',
  RESERVATION_REJECTED = 'RESERVATION_REJECTED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export interface Notification extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  relatedEntityId?: string;
  relatedEntityType?: string;
  metadata?: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = new Schema<Notification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
      required: true,
      index: true,
    },
    relatedEntityId: {
      type: String,
      required: false,
    },
    relatedEntityType: {
      type: String,
      required: false,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
    readAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const NotificationModel = model<Notification>(
  'Notification',
  NotificationSchema,
);
