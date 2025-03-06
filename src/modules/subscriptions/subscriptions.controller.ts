import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDTO } from './dtos/create-subscription-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Criar novo plano de assinatura' })
  @ApiResponse({
    status: 201,
    description: 'Plano criado com sucesso',
  })
  async createPlan(
    @Body() createPlanDto: CreateSubscriptionPlanDTO,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Creating new subscription plan', {
      endpoint: '/subscriptions/plans',
      method: 'POST',
      userId: user.id,
      body: JSON.stringify(createPlanDto),
    });

    try {
      const result = await this.subscriptionsService.createPlan(createPlanDto);

      await this.lokiLogger.info('Subscription plan created successfully', {
        endpoint: '/subscriptions/plans',
        method: 'POST',
        userId: user.id,
        planId: result.id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to create subscription plan', error, {
        endpoint: '/subscriptions/plans',
        method: 'POST',
        userId: user.id,
        body: JSON.stringify(createPlanDto),
      });
      throw error;
    }
  }

  @Get('plans')
  @ApiOperation({ summary: 'Listar todos os planos disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos retornada com sucesso',
  })
  async listPlans() {
    await this.lokiLogger.info('Fetching all subscription plans', {
      endpoint: '/subscriptions/plans',
      method: 'GET',
    });

    try {
      const result = await this.subscriptionsService.listPlans();

      await this.lokiLogger.info('Subscription plans fetched successfully', {
        endpoint: '/subscriptions/plans',
        method: 'GET',
        totalPlans: result.length,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch subscription plans', error, {
        endpoint: '/subscriptions/plans',
        method: 'GET',
      });
      throw error;
    }
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiResponse({
    status: 200,
    description: 'Plano encontrado com sucesso',
  })
  async getPlan(@Param('id') id: string) {
    await this.lokiLogger.info('Fetching subscription plan', {
      endpoint: '/subscriptions/plans/:id',
      method: 'GET',
      planId: id,
    });

    try {
      const result = await this.subscriptionsService.getPlanById(id);

      await this.lokiLogger.info('Subscription plan fetched successfully', {
        endpoint: '/subscriptions/plans/:id',
        method: 'GET',
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch subscription plan', error, {
        endpoint: '/subscriptions/plans/:id',
        method: 'GET',
        planId: id,
      });
      throw error;
    }
  }

  @Put('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Atualizar plano' })
  @ApiResponse({
    status: 200,
    description: 'Plano atualizado com sucesso',
  })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: CreateSubscriptionPlanDTO,
    @User() user: UserInterface,
  ) {
    await this.lokiLogger.info('Updating subscription plan', {
      endpoint: '/subscriptions/plans/:id',
      method: 'PUT',
      userId: user.id,
      planId: id,
      body: JSON.stringify(updatePlanDto),
    });

    try {
      const result = await this.subscriptionsService.updatePlan(id, updatePlanDto);

      await this.lokiLogger.info('Subscription plan updated successfully', {
        endpoint: '/subscriptions/plans/:id',
        method: 'PUT',
        userId: user.id,
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to update subscription plan', error, {
        endpoint: '/subscriptions/plans/:id',
        method: 'PUT',
        userId: user.id,
        planId: id,
        body: JSON.stringify(updatePlanDto),
      });
      throw error;
    }
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Desativar plano' })
  @ApiResponse({
    status: 200,
    description: 'Plano desativado com sucesso',
  })
  async deactivatePlan(@Param('id') id: string, @User() user: UserInterface) {
    await this.lokiLogger.info('Deactivating subscription plan', {
      endpoint: '/subscriptions/plans/:id',
      method: 'DELETE',
      userId: user.id,
      planId: id,
    });

    try {
      const result = await this.subscriptionsService.deactivatePlan(id);

      await this.lokiLogger.info('Subscription plan deactivated successfully', {
        endpoint: '/subscriptions/plans/:id',
        method: 'DELETE',
        userId: user.id,
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to deactivate subscription plan', error, {
        endpoint: '/subscriptions/plans/:id',
        method: 'DELETE',
        userId: user.id,
        planId: id,
      });
      throw error;
    }
  }
}
