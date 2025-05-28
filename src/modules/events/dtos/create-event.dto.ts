import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
} from 'class-validator';
import { EventType, StreamingPlatform } from '../../../schema/events.schema';

export class CreateEventDTO {
  @ApiProperty({
    description: 'Nome do evento',
    example: 'Campeonato de Futebol 2024',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descrição do evento',
    example: 'Campeonato de futebol amador com premiação',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'URL da imagem do evento',
    example: 'https://example.com/event-image.jpg',
  })
  @IsString()
  @IsUrl()
  image: string;

  @ApiProperty({
    description: 'Data de início do evento',
    example: '2024-05-01T10:00:00Z',
  })
  @IsDate()
  startDate: Date;

  @ApiProperty({
    description: 'Data de término do evento',
    example: '2024-05-01T18:00:00Z',
  })
  @IsDate()
  endDate: Date;

  @ApiProperty({
    description: 'ID da quadra onde o evento acontecerá',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  courtId: string;

  @ApiProperty({
    description: 'Valor do evento (0 para evento gratuito)',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
    example: EventType.TOURNAMENT,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({
    description: 'Regras do evento em formato de texto',
    example:
      '1. Idade mínima: 18 anos\n2. Equipes de 5 jogadores\n3. Uniforme completo obrigatório',
  })
  @IsString()
  rules: string;

  @ApiProperty({
    description: 'Se o evento terá transmissão ao vivo',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @ApiProperty({
    description: 'Plataforma de streaming',
    enum: StreamingPlatform,
    required: false,
  })
  @IsOptional()
  @IsEnum(StreamingPlatform)
  streamingPlatform?: StreamingPlatform;

  @ApiProperty({
    description: 'URL da transmissão ao vivo',
    example: 'https://youtube.com/watch?v=...',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  streamingUrl?: string;
}
