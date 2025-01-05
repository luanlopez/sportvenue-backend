import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserProfileDto } from './dtos/user-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PreRegisterDTO } from './dtos/pre-register.dto';
import { VerifyRegistrationDTO } from './dtos/verify-registration.dto';

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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
}
