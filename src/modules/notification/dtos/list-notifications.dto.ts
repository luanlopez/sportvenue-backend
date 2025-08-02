import { IsOptional, IsEnum, IsMongoId, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationStatus,
} from 'src/schema/notification.schema';

export class ListNotificationsDTO {
  @ApiProperty({
    description: 'ID of the user to get notifications for',
    example: '67630fcec71dd5ee02a136bc',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Type of notification to filter by',
    example: 'RESERVATION_APPROVED',
    enum: NotificationType,
    required: false,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({
    description: 'Status of notification to filter by',
    example: 'UNREAD',
    enum: NotificationStatus,
    required: false,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
