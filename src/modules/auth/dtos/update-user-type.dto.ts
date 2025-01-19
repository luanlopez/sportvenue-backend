import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/schema/user.schema';

export class UpdateUserTypeDTO {
  @IsEnum(UserType)
  @IsNotEmpty()
  @ApiProperty({
    enum: UserType,
    description: 'Tipo do usuário',
    example: UserType.HOUSE_OWNER,
  })
  userType: UserType;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'CPF ou CNPJ do usuário',
    example: '123.456.789-00',
  })
  document: string;
}
