import { Controller, Body, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserProfileDTO } from './dtos/update-user-profile.dto';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Atualizar perfil do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Perfil atualizado com sucesso',
        },
        user: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              example: 'João',
            },
            lastName: {
              type: 'string',
              example: 'Silva',
            },
            phone: {
              type: 'string',
              example: '(11) 99999-9999',
            },
          },
        },
      },
    },
  })
  async updateProfile(
    @User() user: UserInterface,
    @Body() updateProfileDto: UpdateUserProfileDTO,
  ) {
    await this.lokiLogger.info('Updating user profile', {
      endpoint: '/users/profile',
      method: 'PATCH',
      userId: user.id,
      body: JSON.stringify(updateProfileDto),
    });

    try {
      const updatedUser = await this.usersService.updateProfile(
        user.id,
        updateProfileDto,
      );

      await this.lokiLogger.info('User profile updated successfully', {
        endpoint: '/users/profile',
        method: 'PATCH',
        userId: user.id,
        updatedFields: Object.keys(updateProfileDto),
      });

      return {
        message: 'Perfil atualizado com sucesso',
        user: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
        },
      };
    } catch (error) {
      await this.lokiLogger.error('Failed to update user profile', error, {
        endpoint: '/users/profile',
        method: 'PATCH',
        userId: user.id,
        body: JSON.stringify(updateProfileDto),
      });
      throw error;
    }
  }
}
