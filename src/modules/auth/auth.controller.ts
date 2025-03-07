import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Req,
  Patch,
  UseInterceptors,
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
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import { DecryptInterceptor } from '../../common/interceptors/decrypt.interceptor';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post('login')
  @UseInterceptors(DecryptInterceptor)
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
  async login(@Body() loginDto: { email: string; password: string }) {
    await this.lokiLogger.info('Login attempt', {
      endpoint: '/auth/login',
      method: 'POST',
      email: loginDto.email,
    });

    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      const result = await this.authService.login(user);

      await this.lokiLogger.info('Login successful', {
        endpoint: '/auth/login',
        method: 'POST',
        email: loginDto.email,
        userId: user.id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Login failed', error, {
        endpoint: '/auth/login',
        method: 'POST',
        email: loginDto.email,
      });
      throw error;
    }
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
    await this.lokiLogger.info('Token refresh attempt', {
      endpoint: '/auth/refresh',
      method: 'POST',
    });

    try {
      const result = await this.authService.refreshToken(refreshToken);

      await this.lokiLogger.info('Token refresh successful', {
        endpoint: '/auth/refresh',
        method: 'POST',
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Token refresh failed', error, {
        endpoint: '/auth/refresh',
        method: 'POST',
      });
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req): Promise<UserProfileDto> {
    await this.lokiLogger.info('Fetching user profile', {
      endpoint: '/auth/me',
      method: 'GET',
      userId: req.user.id,
    });

    try {
      const user = await this.authService.me(req.user);

      await this.lokiLogger.info('User profile fetched successfully', {
        endpoint: '/auth/me',
        method: 'GET',
        userId: req.user.id,
      });

      return user;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch user profile', error, {
        endpoint: '/auth/me',
        method: 'GET',
        userId: req.user.id,
      });
      throw error;
    }
  }

  @Post('pre-register')
  @UseInterceptors(DecryptInterceptor)
  @ApiOperation({ summary: 'Start registration process' })
  @ApiResponse({ status: 201, description: 'Verification code sent' })
  async preRegister(@Body() preRegisterDto: PreRegisterDTO) {
    await this.lokiLogger.info('Starting pre-registration', {
      endpoint: '/auth/pre-register',
      method: 'POST',
      email: preRegisterDto.email,
      body: JSON.stringify(preRegisterDto),
    });

    try {
      const result = await this.authService.preRegister(preRegisterDto);

      await this.lokiLogger.info('Pre-registration successful', {
        endpoint: '/auth/pre-register',
        method: 'POST',
        email: preRegisterDto.email,
      });

      return result;
    } catch (error) {
      
      await this.lokiLogger.error('Pre-registration failed', error, {
        endpoint: '/auth/pre-register',
        method: 'POST',
        email: preRegisterDto.email,
      });
      throw error;
    }
  }

  @Post('complete-registration')
  @ApiOperation({ summary: 'Complete registration with verification code' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async completeRegistration(@Body() verifyDto: VerifyRegistrationDTO) {
    await this.lokiLogger.info('Completing registration', {
      endpoint: '/auth/complete-registration',
      method: 'POST',
      body: JSON.stringify(verifyDto),
    });

    try {
      const result = await this.authService.completeRegistration(verifyDto);

      await this.lokiLogger.info('Registration completed successfully', {
        endpoint: '/auth/complete-registration',
        method: 'POST',
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Registration completion failed', error, {
        endpoint: '/auth/complete-registration',
        method: 'POST',
      });
      throw error;
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticação com Google' })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a página de login do Google',
  })
  async googleAuth() {
    await this.lokiLogger.info('Starting Google authentication', {
      endpoint: '/auth/google',
      method: 'GET',
    });
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
    await this.lokiLogger.info('Processing Google authentication callback', {
      endpoint: '/auth/google/callback',
      method: 'GET',
      email: req.user?.email,
    });

    try {
      const tokens = await this.authService.googleLogin(req.user);

      await this.lokiLogger.info('Google authentication successful', {
        endpoint: '/auth/google/callback',
        method: 'GET',
        email: req.user?.email,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      await this.lokiLogger.error('Google authentication failed', error, {
        endpoint: '/auth/google/callback',
        method: 'GET',
        email: req.user?.email,
      });
      throw error;
    }
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
    await this.lokiLogger.info('Updating user type', {
      endpoint: '/auth/update-type',
      method: 'PATCH',
      userId: user.id,
      newUserType: updateUserTypeDto.userType,
      body: JSON.stringify(updateUserTypeDto),
    });

    try {
      const result = await this.authService.updateUserType(
        user.id,
        updateUserTypeDto.userType,
        updateUserTypeDto.document,
      );

      await this.lokiLogger.info('User type updated successfully', {
        endpoint: '/auth/update-type',
        method: 'PATCH',
        userId: user.id,
        newUserType: updateUserTypeDto.userType,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to update user type', error, {
        endpoint: '/auth/update-type',
        method: 'PATCH',
        userId: user.id,
        newUserType: updateUserTypeDto.userType,
      });
      throw error;
    }
  }
}
