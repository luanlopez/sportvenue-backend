import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from 'src/schema/notification.schema';

export class CreateNotificationDTO {
  @ApiProperty({
    description: 'ID of the user who will receive the notification',
    example: '67630fcec71dd5ee02a136bc',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Title of the notification',
    example: 'Reservation Approved',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Message content of the notification',
    example:
      'Your reservation for Court A on Monday at 14:00 has been approved.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiProperty({
    description: 'Type of notification',
    example: 'RESERVATION_APPROVED',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

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
