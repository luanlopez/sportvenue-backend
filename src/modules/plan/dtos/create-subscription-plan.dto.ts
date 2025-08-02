import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '../../../schema/plan.schema';

export class CreateSubscriptionPlanDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nome do plano',
    example: 'Plano Premium',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Descrição do plano',
    example: 'Plano com até 5 quadras e suporte prioritário',
  })
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Preço do plano em centavos',
    example: 9990,
  })
  price: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do preço no Stripe',
    example: 'price_1234567890',
  })
  stripePriceId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Limite de quadras permitido',
    example: 5,
  })
  courtLimit: number;

  @IsEnum(PlanType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tipo do plano',
    enum: PlanType,
    example: PlanType.PREMIUM,
  })
  type: PlanType;
}
