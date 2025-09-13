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
import { PlanService } from './plan.service';
import { CreateSubscriptionPlanDTO } from './dtos/create-subscription-plan.dto';
import { MasterGuard } from '../auth/master.guard';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@ApiTags('Plans')
@Controller('plans')
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Post('')
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
      endpoint: '/plans',
      method: 'POST',
      body: JSON.stringify(createPlanDto),
    });

    try {
      const result = await this.planService.createPlan(createPlanDto);
      await this.lokiLogger.info('Subscription plan created successfully', {
        endpoint: '/plans',
        method: 'POST',
        planId: result._id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to create subscription plan', error, {
        endpoint: '/plans',
        method: 'POST',
        body: JSON.stringify(createPlanDto),
      });
      throw error;
    }
  }

  @Get('')
  @ApiOperation({ summary: 'Listar todos os planos disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos retornada com sucesso',
  })
  async listPlans() {
    await this.lokiLogger.info('Fetching all subscription plans', {
      endpoint: '/plans',
      method: 'GET',
    });

    try {
      const result = await this.planService.listPlans();

      await this.lokiLogger.info('Subscription plans fetched successfully', {
        endpoint: '/plans',
        method: 'GET',
        totalPlans: result.length,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch subscription plans', error, {
        endpoint: '/plans',
        method: 'GET',
      });
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiResponse({
    status: 200,
    description: 'Plano encontrado com sucesso',
  })
  async getPlan(@Param('id') id: string) {
    await this.lokiLogger.info('Fetching subscription plan', {
      endpoint: '/plans/:id',
      method: 'GET',
      planId: id,
    });

    try {
      const result = await this.planService.getPlanById(id);

      await this.lokiLogger.info('Subscription plan fetched successfully', {
        endpoint: '/plans/:id',
        method: 'GET',
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to fetch subscription plan', error, {
        endpoint: '/plans/:id',
        method: 'GET',
        planId: id,
      });
      throw error;
    }
  }

  @Put(':id')
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
      endpoint: '/plans/:id',
      method: 'PUT',
      planId: id,
      body: JSON.stringify(updatePlanDto),
    });

    try {
      const result = await this.planService.updatePlan(id, updatePlanDto);

      await this.lokiLogger.info('Subscription plan updated successfully', {
        endpoint: '/plans/:id',
        method: 'PUT',
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to update subscription plan', error, {
        endpoint: '/plans/plans/:id',
        method: 'PUT',
        planId: id,
        body: JSON.stringify(updatePlanDto),
      });
      throw error;
    }
  }

  @Delete(':id')
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
      endpoint: '/plans/:id',
      method: 'DELETE',
      planId: id,
    });

    try {
      const result = await this.planService.deactivatePlan(id);

      await this.lokiLogger.info('Subscription plan deactivated successfully', {
        endpoint: '/plans/:id',
        method: 'DELETE',
        planId: id,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to deactivate subscription plan',
        error,
        {
          endpoint: '/plans/:id',
          method: 'DELETE',
          planId: id,
        },
      );
      throw error;
    }
  }
}
