import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'ID do plano' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ description: 'ID da sessão da Stripe' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
 