import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TextSearchDto {
  @ApiProperty({
    description: 'Text query to search for places',
    example: 'quadra de futebol São Paulo',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiProperty({
    description: 'Type of place to search',
    example: 'gym',
    required: false,
    default: 'gym',
  })
  @IsOptional()
  @IsString()
  type?: string;
} 