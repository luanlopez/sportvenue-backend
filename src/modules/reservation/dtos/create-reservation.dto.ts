import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
