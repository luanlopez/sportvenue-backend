import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSubscriptionDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID do plano de assinatura',
    example: '507f1f77bcf86cd799439011',
  })
  subscriptionPlanId: string;
}
