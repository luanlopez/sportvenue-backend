import { IsString, IsArray, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { CourtAmenities } from '../enums/court-amenities.enum';
import { CourtCategories } from '../enums/court-categories.enum';

export class WeeklyScheduleDTO {
  @ApiProperty({
    description: 'Available hours for Monday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  monday?: string[];

  @ApiProperty({
    description: 'Available hours for Tuesday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  tuesday?: string[];

  @ApiProperty({
    description: 'Available hours for Wednesday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  wednesday?: string[];

  @ApiProperty({
    description: 'Available hours for Thursday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  thursday?: string[];

  @ApiProperty({
    description: 'Available hours for Friday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  friday?: string[];

  @ApiProperty({
    description: 'Available hours for Saturday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  saturday?: string[];

  @ApiProperty({
    description: 'Available hours for Sunday',
    example: ['08:00', '09:00', '10:00'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  sunday?: string[];
}

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
    description: 'The name of the court',
    example: 'Central Court',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'An optional reason for the court creation',
    example: 'Opening a new court in the city center',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  price_per_hour: number;

  @ApiProperty({ enum: CourtAmenities, isArray: true })
  @IsArray()
  @IsEnum(CourtAmenities, { each: true })
  amenities: CourtAmenities[];

  @ApiProperty({ enum: CourtCategories, isArray: true })
  @IsArray()
  @IsEnum(CourtCategories, { each: true })
  categories: CourtCategories[];

  @ApiProperty({
    description: 'Array of image URLs for the court',
    example: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Weekly schedule with available hours for each day',
    type: WeeklyScheduleDTO,
  })
  @IsObject()
  @IsNotEmpty()
  weeklySchedule: WeeklyScheduleDTO;
}
