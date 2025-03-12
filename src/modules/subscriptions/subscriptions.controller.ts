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
import { ApiOperation, ApiResponse, ApiTags, ApiHeader } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDTO } from './dtos/create-subscription-plan.dto';
import { MasterGuard } from '../auth/master.guard';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post('plans')
  @UseGuards(MasterGuard)
  @ApiOperation({
    summary: 'Criar novo plano de assinatura (requer master key)',
  })
  @ApiHeader({
    name: 'x-master-key',
    description: 'Chave de acesso master para gerenciamento de planos',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Plano criado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - Master key inválida ou não fornecida',
  })
  async createPlan(@Body() createPlanDto: CreateSubscriptionPlanDTO) {
    await this.lokiLogger.info('Creating new subscription plan', {
      endpoint: '/subscriptions/plans',
      method: 'POST',
      body: JSON.stringify(createPlanDto),
    });

    try {
      const result = await this.subscriptionsService.createPlan(createPlanDto);
      await this.lokiLogger.info('Subscription plan created successfully', {
        endpoint: '/subscriptions/plans',
        method: 'POST',
        planId: result._id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to create subscription plan', error, {
        endpoint: '/subscriptions/plans',
        method: 'POST',
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
  @UseGuards(MasterGuard)
  @ApiOperation({ summary: 'Atualizar plano (requer master key)' })
  @ApiHeader({
    name: 'x-master-key',
    description: 'Chave de acesso master para gerenciamento de planos',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Plano atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - Master key inválida ou não fornecida',
  })
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: CreateSubscriptionPlanDTO,
  ) {
    await this.lokiLogger.info('Updating subscription plan', {
      endpoint: '/subscriptions/plans/:id',
      method: 'PUT',
      planId: id,
      body: JSON.stringify(updatePlanDto),
    });

    try {
      const result = await this.subscriptionsService.updatePlan(
        id,
        updatePlanDto,
      );

      await this.lokiLogger.info('Subscription plan updated successfully', {
        endpoint: '/subscriptions/plans/:id',
        method: 'PUT',
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to update subscription plan', error, {
        endpoint: '/subscriptions/plans/:id',
        method: 'PUT',
        planId: id,
        body: JSON.stringify(updatePlanDto),
      });
      throw error;
    }
  }

  @Delete('plans/:id')
  @UseGuards(MasterGuard)
  @ApiOperation({ summary: 'Desativar plano (requer master key)' })
  @ApiHeader({
    name: 'x-master-key',
    description: 'Chave de acesso master para gerenciamento de planos',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Plano desativado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado - Master key inválida ou não fornecida',
  })
  async deactivatePlan(@Param('id') id: string) {
    await this.lokiLogger.info('Deactivating subscription plan', {
      endpoint: '/subscriptions/plans/:id',
      method: 'DELETE',
      planId: id,
    });

    try {
      const result = await this.subscriptionsService.deactivatePlan(id);

      await this.lokiLogger.info('Subscription plan deactivated successfully', {
        endpoint: '/subscriptions/plans/:id',
        method: 'DELETE',
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to deactivate subscription plan',
        error,
        {
          endpoint: '/subscriptions/plans/:id',
          method: 'DELETE',
          planId: id,
        },
      );
      throw error;
    }
  }
}
