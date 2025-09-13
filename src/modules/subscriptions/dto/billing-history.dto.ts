import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'ID do usuário' })
  _id: string;

  @ApiProperty({ description: 'Nome do usuário' })
  firstName: string;

  @ApiProperty({ description: 'Sobrenome do usuário' })
  lastName: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;
}

export class PlanDto {
  @ApiProperty({ description: 'ID do plano' })
  _id: string;

  @ApiProperty({ description: 'Nome do plano' })
  name: string;

  @ApiProperty({ description: 'Preço do plano em centavos' })
  price: number;

  @ApiProperty({
    description: 'Tipo do plano',
    enum: ['BASIC', 'PREMIUM', 'ENTERPRISE'],
  })
  type: string;
}

export class SubscriptionDto {
  @ApiProperty({ description: 'ID da subscription' })
  id: string;

  @ApiProperty({ description: 'ID da subscription na Stripe' })
  stripeSubscriptionId: string;

  @ApiProperty({
    description: 'Status da subscription',
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
  })
  status: string;

  @ApiProperty({ description: 'Dados do usuário', type: UserDto })
  user: UserDto;

  @ApiProperty({ description: 'Dados do plano', type: PlanDto })
  plan: PlanDto;
}

export class InvoiceDto {
  @ApiProperty({ description: 'ID do invoice na Stripe' })
  id: string;

  @ApiProperty({ description: 'Número do invoice' })
  number: string;

  @ApiProperty({ description: 'Valor do invoice em centavos' })
  amount: number;

  @ApiProperty({ description: 'Moeda do invoice' })
  currency: string;

  @ApiProperty({ description: 'Status do invoice' })
  status: string;

  @ApiProperty({ description: 'Data de criação do invoice' })
  created: Date;

  @ApiProperty({
    description: 'Data de vencimento do invoice',
    required: false,
  })
  dueDate?: Date;

  @ApiProperty({ description: 'Se o invoice foi pago' })
  paid: boolean;

  @ApiProperty({ description: 'Método de pagamento', enum: ['card', 'boleto'] })
  paymentMethod: string;
}

export class PaymentIntentDto {
  @ApiProperty({ description: 'ID do payment intent na Stripe' })
  id: string;

  @ApiProperty({ description: 'Valor do payment intent em centavos' })
  amount: number;

  @ApiProperty({ description: 'Moeda do payment intent' })
  currency: string;

  @ApiProperty({ description: 'Status do payment intent' })
  status: string;

  @ApiProperty({ description: 'Data de criação do payment intent' })
  created: Date;

  @ApiProperty({ description: 'Método de pagamento' })
  paymentMethod: string;
}

export class BillingSummaryDto {
  @ApiProperty({ description: 'Total de invoices' })
  totalInvoices: number;

  @ApiProperty({ description: 'Total pago em centavos' })
  totalPaid: number;

  @ApiProperty({ description: 'Total pendente em centavos' })
  totalPending: number;

  @ApiProperty({
    description: 'Último pagamento',
    type: InvoiceDto,
    required: false,
  })
  lastPayment?: InvoiceDto;
}

export class BillingHistoryDto {
  @ApiProperty({ description: 'Dados da subscription', type: SubscriptionDto })
  subscription: SubscriptionDto;

  @ApiProperty({ description: 'Lista de invoices', type: [InvoiceDto] })
  invoices: InvoiceDto[];
}
