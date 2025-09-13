import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscriptionInfoDto } from './dto/subscription-info.dto';
import { InvoiceDetailsDto } from './dto/invoice-details.dto';
import { BillingHistoryQueryDto } from './dto/billing-history-query.dto';
import { PaginatedBillingHistoryDto } from './dto/paginated-billing-history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER', 'USER')
  @ApiOperation({ summary: 'Criar nova subscription' })
  @ApiResponse({
    status: 201,
    description: 'Subscription criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Cancelar subscription no final do período atual' })
  @ApiResponse({
    status: 200,
    description: 'Subscription será cancelada no final do período atual',
  })
  @ApiResponse({
    status: 400,
    description: 'Confirmação necessária ou subscription já cancelada',
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async cancelSubscription(
    @User() user: UserInterface,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancelSubscription(
      user.id,
      cancelSubscriptionDto,
    );
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Reativar subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription reativada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Subscription já reativada',
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async reactivateSubscription(@User() user: UserInterface) {
    return this.subscriptionsService.reactivateSubscription(user.id);
  }

  @Get('billing-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({
    summary:
      'Buscar histórico de cobrança da subscription com filtros e paginação',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página atual',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Itens por página',
    type: Number,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status',
    enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data inicial (ISO string)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data final (ISO string)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de cobrança retornado com sucesso',
    type: PaginatedBillingHistoryDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async getBillingHistory(
    @User() user: UserInterface,
    @Query() query: BillingHistoryQueryDto,
  ): Promise<PaginatedBillingHistoryDto> {
    return this.subscriptionsService.getBillingHistory(user.id, query);
  }

  @Get('invoice/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Buscar detalhes de uma invoice específica' })
  @ApiParam({ name: 'invoiceId', description: 'ID da invoice no Stripe' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da invoice retornados com sucesso',
    type: InvoiceDetailsDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice não encontrada' })
  async getInvoiceDetails(
    @Param('invoiceId') invoiceId: string,
  ): Promise<InvoiceDetailsDto> {
    return this.subscriptionsService.getInvoiceDetails(invoiceId);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Buscar informações detalhadas da subscription' })
  @ApiResponse({
    status: 200,
    description: 'Informações da subscription retornadas com sucesso',
    type: SubscriptionInfoDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async getSubscriptionInfo(
    @User() user: UserInterface,
  ): Promise<SubscriptionInfoDto> {
    return this.subscriptionsService.getSubscriptionInfo(user.id);
  }
}
