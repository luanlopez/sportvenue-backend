import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserProfileDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Primeiro nome do usuário',
    example: 'João',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva',
  })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Telefone do usuário',
    example: '(11) 99999-9999',
  })
  phone: string;
}
