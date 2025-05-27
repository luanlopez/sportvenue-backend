import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum BillingStatus {
  PENDING = 'PENDING',
  PAGO_PRESENCIALMENTE = 'PAGO_PRESENCIALMENTE',
  PAGO_SPORTMAP = 'PAGO_SPORTMAP',
}

export enum BillingType {
  PRESENCIAL = 'PRESENCIAL',
  ONLINE = 'ONLINE',
}

export class CreateBillingDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID da reserva',
    example: '507f1f77bcf86cd799439011',
  })
  reservationId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do dono da quadra',
    example: '507f1f77bcf86cd799439011',
  })
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do usuário que fez a reserva',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID da quadra',
    example: '507f1f77bcf86cd799439011',
  })
  courtId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Valor da cobrança',
    example: 100.5,
  })
  amount: number;

  @IsEnum(BillingType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tipo de pagamento',
    enum: BillingType,
    example: BillingType.PRESENCIAL,
  })
  billingType: BillingType;

  @IsOptional()
  @ApiProperty({
    description: 'Data de vencimento',
    example: '2023-12-31',
    required: false,
  })
  dueDate?: Date;

  @IsOptional()
  @ApiProperty({
    description: 'Data do último pagamento',
    example: '2023-12-31',
    required: false,
  })
  lastPaidAt?: Date;

  @IsOptional()
  @ApiProperty({
    description: 'Data do próximo pagamento',
    example: '2023-12-31',
    required: false,
  })
  nextPaidAt?: Date;

  @IsOptional()
  @ApiProperty({
    description: 'Metadados adicionais',
    example: { notes: 'Pagamento mensal' },
    required: false,
  })
  metadata?: Record<string, any>;
}
