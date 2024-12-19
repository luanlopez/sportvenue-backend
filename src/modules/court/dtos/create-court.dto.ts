import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourtDTO {
  @ApiProperty({
    description: 'The address of the court',
    example: '123 Main Street',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'The neighborhood where the court is located',
    example: 'Downtown',
  })
  @IsString()
  neighborhood: string;

  @ApiProperty({
    description: 'The city where the court is located',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'The number of the court building',
    example: '45A',
  })
  @IsString()
  number: string;

  @ApiProperty({
    description: 'The owner ID of the court',
    example: '123456',
  })
  @IsString()
  owner_id: string;

  @ApiProperty({
    description: 'The name of the court',
    example: 'Central Court',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The available hours for booking the court',
    example: ['08:00 AM - 10:00 AM', '02:00 PM - 04:00 PM'],
  })
  @IsArray()
  availableHours: string[];

  @ApiProperty({
    description: 'An optional reason for the court creation',
    example: 'Opening a new court in the city center',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
