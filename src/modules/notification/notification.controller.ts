import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { NotificationService } from './notification.service';
import { CreateNotificationDTO } from './dtos/create-notification.dto';
import { UpdateNotificationDTO } from './dtos/update-notification.dto';
import { ListNotificationsDTO } from './dtos/list-notifications.dto';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post()
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification created successfully',
        },
        notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67630fcec71dd5ee02a136bc',
            },
            userId: {
              type: 'string',
              example: '67630fcec71dd5ee02a136bc',
            },
            title: {
              type: 'string',
              example: 'Reservation Approved',
            },
            message: {
              type: 'string',
              example:
                'Your reservation for Court A on Monday at 14:00 has been approved.',
            },
            type: {
              type: 'string',
              example: 'RESERVATION_APPROVED',
            },
            status: {
              type: 'string',
              example: 'UNREAD',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDTO,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Creating notification', {
      endpoint: '/notifications',
      method: 'POST',
      userId: user.id,
      body: JSON.stringify(createNotificationDto),
    });

    try {
      const notification = await this.notificationService.createNotification(
        createNotificationDto,
      );

      await this.lokiLogger.info('Notification created successfully', {
        endpoint: '/notifications',
        method: 'POST',
        userId: user.id,
        notificationId: notification._id.toString(),
      });

      return {
        message: 'Notification created successfully',
        notification,
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to create notification', error, {
        endpoint: '/notifications',
        method: 'POST',
        userId: user.id,
        body: JSON.stringify(createNotificationDto),
      });
      throw error;
    }
  }

  @Get()
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Get notifications with pagination and filtering' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
    example: '67630fcec71dd5ee02a136bc',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by notification type',
    example: 'RESERVATION_APPROVED',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by notification status',
    example: 'UNREAD',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notifications retrieved successfully',
        },
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: {
                type: 'string',
                example: '67630fcec71dd5ee02a136bc',
              },
              userId: {
                type: 'string',
                example: '67630fcec71dd5ee02a136bc',
              },
              title: {
                type: 'string',
                example: 'Reservation Approved',
              },
              message: {
                type: 'string',
                example:
                  'Your reservation for Court A on Monday at 14:00 has been approved.',
              },
              type: {
                type: 'string',
                example: 'RESERVATION_APPROVED',
              },
              status: {
                type: 'string',
                example: 'UNREAD',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
        total: {
          type: 'number',
          example: 25,
        },
        page: {
          type: 'number',
          example: 1,
        },
        limit: {
          type: 'number',
          example: 10,
        },
        totalPages: {
          type: 'number',
          example: 3,
        },
      },
    },
  })
  async getNotifications(
    @Query() listNotificationsDto: ListNotificationsDTO,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Getting notifications', {
      endpoint: '/notifications',
      method: 'GET',
      userId: user.id,
      query: JSON.stringify(listNotificationsDto),
    });

    try {
      const result = await this.notificationService.listNotifications(
        listNotificationsDto,
        user.id,
      );

      await this.lokiLogger.info('Notifications retrieved successfully', {
        endpoint: '/notifications',
        method: 'GET',
        userId: user.id,
        count: result.notifications.length,
        total: result.total,
      });

      return {
        message: 'Notifications retrieved successfully',
        ...result,
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to get notifications', error, {
        endpoint: '/notifications',
        method: 'GET',
        userId: user.id,
        query: JSON.stringify(listNotificationsDto),
      });
      throw error;
    }
  }

  @Get('my')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User notifications retrieved successfully',
  })
  async getMyNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Getting user notifications', {
      endpoint: '/notifications/my',
      method: 'GET',
      userId: user.id,
      page,
      limit,
    });

    try {
      const result = await this.notificationService.getUserNotifications(
        user.id,
        page,
        limit,
      );

      await this.lokiLogger.info('User notifications retrieved successfully', {
        endpoint: '/notifications/my',
        method: 'GET',
        userId: user.id,
        count: result.notifications.length,
        total: result.total,
      });

      return {
        message: 'User notifications retrieved successfully',
        ...result,
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to get user notifications', error, {
        endpoint: '/notifications/my',
        method: 'GET',
        userId: user.id,
        page,
        limit,
      });
      throw error;
    }
  }

  @Get('unread-count')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Get unread notifications count for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Unread count retrieved successfully',
        },
        count: {
          type: 'number',
          example: 5,
        },
      },
    },
  })
  async getUnreadCount(@User() user: UserInterface) {
    await this.lokiLogger.info('Getting unread count', {
      endpoint: '/notifications/unread-count',
      method: 'GET',
      userId: user.id,
    });

    try {
      const count = await this.notificationService.getUnreadCount(user.id);

      await this.lokiLogger.info('Unread count retrieved successfully', {
        endpoint: '/notifications/unread-count',
        method: 'GET',
        userId: user.id,
        count,
      });

      return {
        message: 'Unread count retrieved successfully',
        count,
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to get unread count', error, {
        endpoint: '/notifications/unread-count',
        method: 'GET',
        userId: user.id,
      });
      throw error;
    }
  }

  @Get(':id')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '67630fcec71dd5ee02a136bc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification retrieved successfully',
        },
        notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67630fcec71dd5ee02a136bc',
            },
            userId: {
              type: 'string',
              example: '67630fcec71dd5ee02a136bc',
            },
            title: {
              type: 'string',
              example: 'Reservation Approved',
            },
            message: {
              type: 'string',
              example:
                'Your reservation for Court A on Monday at 14:00 has been approved.',
            },
            type: {
              type: 'string',
              example: 'RESERVATION_APPROVED',
            },
            status: {
              type: 'string',
              example: 'UNREAD',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async getNotificationById(
    @Param('id') id: string,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Getting notification by ID', {
      endpoint: `/notifications/${id}`,
      method: 'GET',
      userId: user.id,
      notificationId: id,
    });

    try {
      const notification =
        await this.notificationService.getNotificationById(id);

      await this.lokiLogger.info('Notification retrieved successfully', {
        endpoint: `/notifications/${id}`,
        method: 'GET',
        userId: user.id,
        notificationId: id,
      });

      return {
        message: 'Notification retrieved successfully',
        notification,
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to get notification', error, {
        endpoint: `/notifications/${id}`,
        method: 'GET',
        userId: user.id,
        notificationId: id,
      });
      throw error;
    }
  }

  @Put(':id')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '67630fcec71dd5ee02a136bc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification updated successfully',
        },
        notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67630fcec71dd5ee02a136bc',
            },
            userId: {
              type: 'string',
              example: '67630fcec71dd5ee02a136bc',
            },
            title: {
              type: 'string',
              example: 'Reservation Approved',
            },
            message: {
              type: 'string',
              example:
                'Your reservation for Court A on Monday at 14:00 has been approved.',
            },
            type: {
              type: 'string',
              example: 'RESERVATION_APPROVED',
            },
            status: {
              type: 'string',
              example: 'READ',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDTO,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Updating notification', {
      endpoint: `/notifications/${id}`,
      method: 'PUT',
      userId: user.id,
      notificationId: id,
      body: JSON.stringify(updateNotificationDto),
    });

    try {
      const notification = await this.notificationService.updateNotification(
        id,
        updateNotificationDto,
      );

      await this.lokiLogger.info('Notification updated successfully', {
        endpoint: `/notifications/${id}`,
        method: 'PUT',
        userId: user.id,
        notificationId: id,
      });

      return {
        message: 'Notification updated successfully',
        notification,
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to update notification', error, {
        endpoint: `/notifications/${id}`,
        method: 'PUT',
        userId: user.id,
        notificationId: id,
        body: JSON.stringify(updateNotificationDto),
      });
      throw error;
    }
  }

  @Put(':id/read')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '67630fcec71dd5ee02a136bc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async markAsRead(@Param('id') id: string, @User() user: UserInterface) {
    await this.lokiLogger.info('Marking notification as read', {
      endpoint: `/notifications/${id}/read`,
      method: 'PUT',
      userId: user.id,
      notificationId: id,
    });

    try {
      const notification =
        await this.notificationService.markNotificationAsRead(id);

      await this.lokiLogger.info('Notification marked as read successfully', {
        endpoint: `/notifications/${id}/read`,
        method: 'PUT',
        userId: user.id,
        notificationId: id,
      });

      return {
        message: 'Notification marked as read successfully',
        notification,
      };
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to mark notification as read',
        error,
        {
          endpoint: `/notifications/${id}/read`,
          method: 'PUT',
          userId: user.id,
          notificationId: id,
        },
      );
      throw error;
    }
  }

  @Put('mark/all')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'All notifications marked as read successfully',
        },
      },
    },
  })
  async markAllAsRead(@User() user: UserInterface) {
    await this.lokiLogger.info('Marking all notifications as read', {
      endpoint: '/notifications/mark-all-read',
      method: 'PUT',
      userId: user.id,
    });

    try {
      await this.notificationService.markAllUserNotificationsAsRead(user.id);

      await this.lokiLogger.info(
        'All notifications marked as read successfully',
        {
          endpoint: '/notifications/mark-all-read',
          method: 'PUT',
          userId: user.id,
        },
      );

      return {
        message: 'All notifications marked as read successfully',
      };
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to mark all notifications as read',
        error,
        {
          endpoint: '/notifications/mark-all-read',
          method: 'PUT',
          userId: user.id,
        },
      );
      throw error;
    }
  }

  @Delete(':id')
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({
    name: 'id',
    description: 'Notification ID',
    example: '67630fcec71dd5ee02a136bc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Param('id') id: string,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Deleting notification', {
      endpoint: `/notifications/${id}`,
      method: 'DELETE',
      userId: user.id,
      notificationId: id,
    });

    try {
      await this.notificationService.deleteNotification(id);

      await this.lokiLogger.info('Notification deleted successfully', {
        endpoint: `/notifications/${id}`,
        method: 'DELETE',
        userId: user.id,
        notificationId: id,
      });

      return {
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to delete notification', error, {
        endpoint: `/notifications/${id}`,
        method: 'DELETE',
        userId: user.id,
        notificationId: id,
      });
      throw error;
    }
  }
}
