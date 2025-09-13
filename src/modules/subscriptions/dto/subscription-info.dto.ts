import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionInfoDto {
  @ApiProperty({
    description: 'ID da subscription',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'ID da subscription no Stripe',
    example: 'sub_1234567890',
  })
  stripeSubscriptionId: string;

  @ApiProperty({
    description: 'Status da subscription',
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Informações do plano',
  })
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    courtLimit: number;
    features: string[];
  };

  @ApiProperty({
    description: 'Informações de uso das quadras',
  })
  courtUsage: {
    totalCreated: number;
    limit: number;
    available: number;
  };

  @ApiProperty({
    description: 'Informações de cobrança',
  })
  billing: {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    cancelAt?: Date;
    amount: number;
    currency: string;
  };

  @ApiProperty({
    description: 'Data de criação da subscription',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Informações do método de pagamento',
  })
  paymentMethod: {
    id: string;
    brand: string;
    last4: string;
  };
}
