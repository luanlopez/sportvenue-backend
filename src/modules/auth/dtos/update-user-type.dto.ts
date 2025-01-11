import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/schema/user.schema';

export class UpdateUserTypeDTO {
  @ApiProperty({
    enum: UserType,
    description: 'Tipo do usuário (USER ou HOUSE_OWNER)',
    example: UserType.USER,
  })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;
}
