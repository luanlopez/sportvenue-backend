import { Controller, Body, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AssignSubscriptionDTO } from './dtos/assign-subscription.dto';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

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
}
