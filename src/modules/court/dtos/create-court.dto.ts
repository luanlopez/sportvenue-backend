import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { CourtAmenities } from '../enums/court-amenities.enum';
import { CourtCategories } from '../enums/court-categories.enum';

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
    description: 'The ID of the court owner',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

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
}
