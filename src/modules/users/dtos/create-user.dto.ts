import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from 'src/schema/user.schema';

export class CreateUserDTOInput {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'HmL8dTXxdhf4DsgJdc7NpUqCtZM/UZOAU76L73CInKmFAKN7aFPxc456z1ntZiN7',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '1234567890',
    required: false,
  })
  @IsString()
  phone?: string;

  @ApiProperty({
    description:
      'User type of the user, optional. If not provided, defaults to HOUSE_OWNER.',
    example: 'USER',
    enum: UserType,
    required: false,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @ApiProperty({
    description: 'Picture of the user',
    example: 'https://example.com/picture.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({
    description: 'Google ID of the user',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'CPF ou CNPJ do usuário',
    example: '123.456.789-00',
  })
  document?: string;
}

export class CreateUserDTOOutput {
  @ApiProperty({
    description: 'Unique identifier of the created user',
    example: '67630fcec71dd5ee02a136bc',
  })
  id: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'User type of the user, optional. If not provided, defaults to HOUSE_OWNER.',
    example: 'USER',
    enum: UserType,
    required: false,
  })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;
}
