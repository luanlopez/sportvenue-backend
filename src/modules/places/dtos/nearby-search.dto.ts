import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NearbySearchDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: -23.5505,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -46.6333,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Search radius in meters',
    example: 5000,
    required: false,
    default: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50000)
  radius?: number;

  @ApiProperty({
    description: 'Type of place to search',
    example: 'gym',
    required: false,
    default: 'gym',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Additional keyword for search',
    example: 'quadra',
    required: false,
    default: 'quadra',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
} 