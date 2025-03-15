import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDTO {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}

export class ResetPasswordDTO {
  @ApiProperty({
    description: 'Código de verificação recebido por email',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Código de verificação é obrigatório' })
  code: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'novaSenha123',
  })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  newPassword: string;
}
