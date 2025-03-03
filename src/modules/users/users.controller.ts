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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    return this.usersService.assignSubscription(
      user.id,
      assignSubscriptionDto.subscriptionPlanId,
    );
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
    const updatedUser = await this.usersService.updateProfile(
      user.id,
      updateProfileDto,
    );

    return {
      message: 'Perfil atualizado com sucesso',
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
      },
    };
  }
}
