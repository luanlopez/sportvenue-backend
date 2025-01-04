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
import { CreateUserDTOInput } from '../users/dtos/create-user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserProfileDto } from './dtos/user-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    description: 'User registration data',
    type: CreateUserDTOInput,
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid data provided.',
  })
  async register(@Body() userData: CreateUserDTOInput) {
    return this.authService.register(userData);
  }

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
}
