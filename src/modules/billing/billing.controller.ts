import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpdateBillingDTO } from './dtos/update-billing.dto';
import { BillingStatus, BillingType } from './dtos/create-billing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  @Patch(':id/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({
    summary: 'Atualizar status de pagamento (para pagamentos presenciais)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da cobrança',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status de pagamento atualizado com sucesso.',
  })
  async updatePaymentStatus(
    @User() user: UserInterface,
    @Param('id') billingId: string,
    @Body() updateDto: UpdateBillingDTO,
  ) {
    await this.lokiLogger.info('Updating billing payment status', {
      endpoint: '/billing/:id/payment-status',
      method: 'PATCH',
      userId: user.id,
      billingId,
      status: updateDto.status,
    });

    try {
      const result = await this.billingService.updateBillingStatus(
        user.id,
        billingId,
        updateDto,
      );

      await this.lokiLogger.info(
        'Billing payment status updated successfully',
        {
          endpoint: '/billing/:id/payment-status',
          method: 'PATCH',
          userId: user.id,
          billingId,
          status: updateDto.status,
        },
      );

      return result;
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to update billing payment status',
        error,
        {
          endpoint: '/billing/:id/payment-status',
          method: 'PATCH',
          userId: user.id,
          billingId,
        },
      );

      throw error;
    }
  }

  @Get('reservation/:reservationId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar cobranças por reserva' })
  @ApiParam({
    name: 'reservationId',
    description: 'ID da reserva',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BillingStatus,
    description: 'Filtrar por status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de cobranças retornada com sucesso',
  })
  async getBillingsByReservation(
    @User() user: UserInterface,
    @Param('reservationId') reservationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: BillingStatus,
  ) {
    await this.lokiLogger.info('Getting billings by reservation', {
      endpoint: '/billing/reservation/:reservationId',
      method: 'GET',
      userId: user.id,
      reservationId,
      page,
      limit,
      status,
    });

    try {
      const result = await this.billingService.getBillingsByReservation(
        user.id,
        reservationId,
        { page, limit, status },
      );

      await this.lokiLogger.info(
        'Billings by reservation retrieved successfully',
        {
          endpoint: '/billing/reservation/:reservationId',
          method: 'GET',
          userId: user.id,
          reservationId,
          total: result.total,
        },
      );

      return result;
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to retrieve billings by reservation',
        error,
        {
          endpoint: '/billing/reservation/:reservationId',
          method: 'GET',
          userId: user.id,
          reservationId,
        },
      );

      throw error;
    }
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar cobranças do usuário' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BillingStatus,
    description: 'Filtrar por status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de cobranças retornada com sucesso',
  })
  async getUserBillings(
    @User() user: UserInterface,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: BillingStatus,
  ) {
    await this.lokiLogger.info('Getting user billings', {
      endpoint: '/billing/user',
      method: 'GET',
      userId: user.id,
      page,
      limit,
      status,
    });

    try {
      const result = await this.billingService.getBillingsByUser(user.id, {
        page,
        limit,
        status,
      });

      await this.lokiLogger.info('User billings retrieved successfully', {
        endpoint: '/billing/user',
        method: 'GET',
        userId: user.id,
        total: result.total,
      });

      return result;
    } catch (error) {
      await this.lokiLogger.error('Failed to retrieve user billings', error, {
        endpoint: '/billing/user',
        method: 'GET',
        userId: user.id,
      });

      throw error;
    }
  }

  @Get(':billingId/invoices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar faturas por ID de cobrança' })
  @ApiParam({
    name: 'billingId',
    description: 'ID da cobrança',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número da página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BillingStatus,
    description:
      'Filtrar por status do pagamento (PENDING, PAID, EXPIRED, CANCELED)',
  })
  @ApiQuery({
    name: 'payment_method',
    required: false,
    enum: BillingType,
    description: 'Filtrar por método de pagamento (BOLETO, CARD)',
  })
  @ApiQuery({
    name: 'created_at_start',
    required: false,
    type: String,
    description:
      'Data inicial para filtrar por data de criação (formato: YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'created_at_end',
    required: false,
    type: String,
    description:
      'Data final para filtrar por data de criação (formato: YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de faturas retornada com sucesso',
  })
  async getInvoicesByBillingId(
    @User() user: UserInterface,
    @Param('billingId') billingId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: BillingStatus,
    @Query('payment_method') paymentMethod?: BillingType,
    @Query('created_at_start') createdAtStart?: string,
    @Query('created_at_end') createdAtEnd?: string,
  ) {
    await this.lokiLogger.info('Getting invoices by billing ID', {
      endpoint: '/billing/:billingId/invoices',
      method: 'GET',
      userId: user.id,
      billingId,
      page,
      limit,
      status,
      paymentMethod,
      createdAtStart,
      createdAtEnd,
    });

    try {
      const result = await this.billingService.getInvoicesByBillingId(
        user.id,
        billingId,
        {
          page,
          limit,
          status,
          paymentMethod,
          createdAtStart: createdAtStart ? new Date(createdAtStart) : undefined,
          createdAtEnd: createdAtEnd ? new Date(createdAtEnd) : undefined,
        },
      );

      await this.lokiLogger.info(
        'Invoices by billing ID retrieved successfully',
        {
          endpoint: '/billing/:billingId/invoices',
          method: 'GET',
          userId: user.id,
          billingId,
          total: result.total,
        },
      );

      return result;
    } catch (error) {
      await this.lokiLogger.error(
        'Failed to retrieve invoices by billing ID',
        error,
        {
          endpoint: '/billing/:billingId/invoices',
          method: 'GET',
          userId: user.id,
          billingId,
        },
      );

      throw error;
    }
  }
}
