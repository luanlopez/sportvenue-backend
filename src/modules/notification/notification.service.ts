import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationStatus,
} from 'src/schema/notification.schema';
import { CreateNotificationDTO } from './dtos/create-notification.dto';
import { UpdateNotificationDTO } from './dtos/update-notification.dto';
import { ListNotificationsDTO } from './dtos/list-notifications.dto';
import { CustomApiError } from 'src/common/errors/custom-api.error';
import { ErrorCodes } from 'src/common/errors/error-codes';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDTO,
  ): Promise<Notification> {
    try {
      console.log('createNotificationDto', createNotificationDto);
      const notification = new this.notificationModel({
        ...createNotificationDto,
        userId: new Types.ObjectId(createNotificationDto.userId),
        relatedEntityId: createNotificationDto.relatedEntityId,
      });

      const savedNotification = await notification.save();
      this.logger.log(
        `Notification created successfully: ${savedNotification._id}`,
      );

      return savedNotification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw new CustomApiError(
        'Failed to create notification',
        'An error occurred while creating the notification',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async getNotificationById(id: string): Promise<Notification> {
    try {
      const notification = await this.notificationModel
        .findById(new Types.ObjectId(id))
        .exec();

      if (!notification) {
        throw new CustomApiError(
          'Notification not found',
          'The requested notification does not exist',
          ErrorCodes.NOTIFICATION_NOT_FOUND,
          404,
        );
      }

      return notification;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      this.logger.error('Failed to get notification by ID', error);
      throw new CustomApiError(
        'Failed to get notification',
        'An error occurred while retrieving the notification',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async updateNotification(
    id: string,
    updateNotificationDto: UpdateNotificationDTO,
  ): Promise<Notification> {
    try {
      const notification = await this.notificationModel.findById(
        new Types.ObjectId(id),
      );

      if (!notification) {
        throw new CustomApiError(
          'Notification not found',
          'The requested notification does not exist',
          ErrorCodes.NOTIFICATION_NOT_FOUND,
          404,
        );
      }

      if (
        updateNotificationDto.status === NotificationStatus.READ &&
        notification.status !== NotificationStatus.READ
      ) {
        updateNotificationDto['readAt'] = new Date();
      }

      if (updateNotificationDto.relatedEntityId) {
        updateNotificationDto.relatedEntityId = new Types.ObjectId(
          updateNotificationDto.relatedEntityId,
        ) as any;
      }

      const updatedNotification = await this.notificationModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateNotificationDto, {
          new: true,
        })
        .exec();

      this.logger.log(
        `Notification updated successfully: ${updatedNotification._id}`,
      );

      return updatedNotification;
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      this.logger.error('Failed to update notification', error);
      throw new CustomApiError(
        'Failed to update notification',
        'An error occurred while updating the notification',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const result = await this.notificationModel
        .findByIdAndDelete(new Types.ObjectId(id))
        .exec();

      if (!result) {
        throw new CustomApiError(
          'Notification not found',
          'The requested notification does not exist',
          ErrorCodes.NOTIFICATION_NOT_FOUND,
          404,
        );
      }

      this.logger.log(`Notification deleted successfully: ${id}`);
    } catch (error) {
      if (error instanceof CustomApiError) {
        throw error;
      }
      this.logger.error('Failed to delete notification', error);
      throw new CustomApiError(
        'Failed to delete notification',
        'An error occurred while deleting the notification',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async listNotifications(
    listNotificationsDto: ListNotificationsDTO,
    userId: string,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { type, status, page = 1, limit = 10 } = listNotificationsDto;

      const filter: any = {};
      if (userId) {
        filter.userId = new Types.ObjectId(userId);
      }
      if (type) {
        filter.type = type;
      }
      if (status) {
        filter.status = status;
      }

      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.notificationModel.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Retrieved ${notifications.length} notifications out of ${total} total`,
      );

      return {
        notifications,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to list notifications', error);
      throw new CustomApiError(
        'Failed to list notifications',
        'An error occurred while retrieving notifications',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.listNotifications(
      {
        page,
        limit,
      },
      userId,
    );
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    return this.updateNotification(id, {
      status: NotificationStatus.READ,
    });
  }

  async markAllUserNotificationsAsRead(userId: string): Promise<void> {
    try {
      await this.notificationModel.updateMany(
        {
          userId: userId,
          status: NotificationStatus.UNREAD,
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      );

      this.logger.log(`All notifications marked as read for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to mark notifications as read', error);
      throw new CustomApiError(
        'Failed to mark notifications as read',
        'An error occurred while updating notifications',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        status: NotificationStatus.UNREAD,
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to get unread count', error);
      throw new CustomApiError(
        'Failed to get unread count',
        'An error occurred while counting unread notifications',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        500,
      );
    }
  }
}
