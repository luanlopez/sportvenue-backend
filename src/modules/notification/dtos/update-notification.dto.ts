import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationStatus,
} from 'src/schema/notification.schema';

export class UpdateNotificationDTO {
  @ApiProperty({
    description: 'Title of the notification',
    example: 'Reservation Approved',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    description: 'Message content of the notification',
    example:
      'Your reservation for Court A on Monday at 14:00 has been approved.',
    maxLength: 1000,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  message?: string;

  @ApiProperty({
    description: 'Type of notification',
    example: 'RESERVATION_APPROVED',
    enum: NotificationType,
    required: false,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({
    description: 'Status of the notification',
    example: 'READ',
    enum: NotificationStatus,
    required: false,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({
    description: 'ID of the related entity (optional)',
    example: '67630fcec71dd5ee02a136bc',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  relatedEntityId?: string;

  @ApiProperty({
    description: 'Type of the related entity (optional)',
    example: 'reservation',
    required: false,
  })
  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @ApiProperty({
    description: 'Additional metadata for the notification (optional)',
    example: { courtName: 'Court A', time: '14:00' },
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
