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

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Criar novo plano de assinatura' })
  @ApiResponse({
    status: 201,
    description: 'Plano criado com sucesso',
  })
  async createPlan(@Body() createPlanDto: CreateSubscriptionPlanDTO) {
    return this.subscriptionsService.createPlan(createPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Listar todos os planos disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos retornada com sucesso',
  })
  async listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiResponse({
    status: 200,
    description: 'Plano encontrado com sucesso',
  })
  async getPlan(@Param('id') id: string) {
    return this.subscriptionsService.getPlanById(id);
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
  ) {
    return this.subscriptionsService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Desativar plano' })
  @ApiResponse({
    status: 200,
    description: 'Plano desativado com sucesso',
  })
  async deactivatePlan(@Param('id') id: string) {
    return this.subscriptionsService.deactivatePlan(id);
  }
} 