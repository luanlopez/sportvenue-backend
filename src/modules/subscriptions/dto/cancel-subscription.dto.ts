import { ApiProperty } from '@nestjs/swagger';

export class CancelSubscriptionDto {
  @ApiProperty({
    description:
      'Confirmação para cancelar a subscription no final do período atual',
    required: true,
    example: true,
  })
  confirm: boolean;
}
