import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Req,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserProfileDto } from './dtos/user-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PreRegisterDTO } from './dtos/pre-register.dto';
import { VerifyRegistrationDTO } from './dtos/verify-registration.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserTypeDTO } from './dtos/update-user-type.dto';
import { User } from './user.decorator';
import { UserInterface } from './strategies/interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and obtain a JWT token' })
  @ApiBody({
    description: 'User login data',
    type: Object,
    examples: {
      default: {
        value: { email: 'john.doe@example.com', password: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully and JWT token generated',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'The JWT token for authenticated requests',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid credentials.',
  })
  async login(
    @Body() { email, password }: { email: string; password: string },
  ) {
    const user = await this.authService.validateUser(email, password);

    return this.authService.login(user);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh the JWT token' })
  @ApiBody({
    description: 'Provide the refresh token',
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid refresh token.',
  })
  async refreshToken(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req): Promise<UserProfileDto> {
    const user = await this.authService.me(req.user);
    return user;
  }

  @Post('pre-register')
  @ApiOperation({ summary: 'Start registration process' })
  @ApiResponse({ status: 201, description: 'Verification code sent' })
  async preRegister(@Body() preRegisterDto: PreRegisterDTO) {
    return this.authService.preRegister(preRegisterDto);
  }

  @Post('complete-registration')
  @ApiOperation({ summary: 'Complete registration with verification code' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async completeRegistration(@Body() verifyDto: VerifyRegistrationDTO) {
    return this.authService.completeRegistration(verifyDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticação com Google' })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a página de login do Google',
  })
  async googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  @ApiResponse({
    status: 200,
    description: 'Login com Google realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  async googleAuthRedirect(@Req() req) {
    const tokens = await this.authService.googleLogin(req.user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Patch('update-type')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza o tipo do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de usuário atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Tipo de usuário atualizado com sucesso',
        },
        userType: {
          type: 'string',
          enum: ['USER', 'HOUSE_OWNER'],
          example: 'HOUSE_OWNER',
        },
        document: {
          type: 'string',
          example: '123.456.789-00',
        },
      },
    },
  })
  async updateUserType(
    @User() user: UserInterface,
    @Body() updateUserTypeDto: UpdateUserTypeDTO,
  ) {
    return this.authService.updateUserType(
      user.id,
      updateUserTypeDto.userType,
      updateUserTypeDto.document,
    );
  }
}
