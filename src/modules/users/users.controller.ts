import { Controller, Body, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AssignSubscriptionDTO } from './dtos/assign-subscription.dto';
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

  @Patch('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Atribuir plano de assinatura ao usuário' })
  @ApiResponse({
    status: 200,
    description: 'Plano atribuído com sucesso',
  })
  async assignSubscription(
    @User() user: UserInterface,
    @Body() assignSubscriptionDto: AssignSubscriptionDTO,
  ) {
    await this.lokiLogger.info('Assigning subscription plan to user', {
      endpoint: '/users/subscription',
      method: 'PATCH',
      userId: user.id,
      body: JSON.stringify(assignSubscriptionDto),
    });

    try {
      const result = await this.usersService.assignSubscription(
        user.id,
        assignSubscriptionDto.subscriptionPlanId,
      );

      await this.lokiLogger.info('Subscription plan assigned successfully', {
        endpoint: '/users/subscription',
        method: 'PATCH',
        userId: user.id,
        subscriptionPlanId: assignSubscriptionDto.subscriptionPlanId,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to assign subscription plan', error, {
        endpoint: '/users/subscription',
        method: 'PATCH',
        userId: user.id,
        body: JSON.stringify(assignSubscriptionDto),
      });
      throw error;
    }
  }

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
