import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { BillingStatus } from './create-billing.dto';

export class UpdateBillingDTO {
  @IsEnum(BillingStatus)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Status do pagamento',
    enum: BillingStatus,
    example: BillingStatus.PAGO_PRESENCIALMENTE,
  })
  status: BillingStatus;

  @IsOptional()
  @ApiProperty({
    description: 'Metadados adicionais',
    example: { paymentMethod: 'dinheiro', notes: 'Pagamento em espécie' },
    required: false,
  })
  metadata?: Record<string, any>;
}
