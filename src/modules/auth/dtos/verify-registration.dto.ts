import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyRegistrationDTO {
  @ApiProperty({
    description: 'Verification code received by email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
