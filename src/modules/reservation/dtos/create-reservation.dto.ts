import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationType } from '../enums/reservation-type.enum';

export class CreateReservationDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reservedStartTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({ enum: ReservationType })
  @IsEnum(ReservationType)
  @IsNotEmpty()
  reservationType: ReservationType;
}
