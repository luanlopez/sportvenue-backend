import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationDTO {
  @ApiProperty({
    description: 'ID of the owner of the court.',
    example: 'user_2lX2f8JuZMKeTlKjBQ4oia4JItX',
  })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({
    description: 'ID of the user making the reservation.',
    example: 'user_5d3c7b9c8e8a2d0d82d348f6',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'ID of the court being reserved.',
    example: 'court_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @ApiProperty({
    description: 'Start time of the reservation.',
    example: '2024-09-18T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  reservedStartTime: string;

  @ApiProperty({
    description: 'Status of the reservation. Default is "requested".',
    example: 'requested',
    enum: ['requested', 'approved', 'rejected', 'cancelled'],
  })
  @IsEnum(['requested', 'approved', 'rejected', 'cancelled'])
  status: 'requested' | 'approved' | 'rejected' | 'cancelled';
}
