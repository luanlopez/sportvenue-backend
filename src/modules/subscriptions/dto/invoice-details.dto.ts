import { ApiProperty } from '@nestjs/swagger';

export class InvoiceDetailsDto {
  @ApiProperty({ description: 'ID da invoice no Stripe' })
  id: string;

  @ApiProperty({ description: 'Número da invoice' })
  number: string;

  @ApiProperty({ description: 'Status da invoice' })
  status: string;

  @ApiProperty({ description: 'Valor total da invoice' })
  amount: number;

  @ApiProperty({ description: 'Moeda da invoice' })
  currency: string;

  @ApiProperty({ description: 'Data de criação da invoice' })
  created: number;

  @ApiProperty({ description: 'Data de vencimento da invoice' })
  dueDate?: number;

  @ApiProperty({ description: 'Data de pagamento da invoice' })
  paidAt?: number;

  @ApiProperty({ description: 'Descrição da invoice' })
  description?: string;

  @ApiProperty({ description: 'ID da subscription relacionada' })
  subscription?: string;

  @ApiProperty({ description: 'ID do customer' })
  customer?: string;

  @ApiProperty({ description: 'URL para visualizar a invoice' })
  hostedInvoiceUrl?: string;

  @ApiProperty({ description: 'URL para pagamento da invoice' })
  invoicePdf?: string;
}
