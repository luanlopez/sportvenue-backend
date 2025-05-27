import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/roles.guard';
import { Roles } from 'src/modules/auth/roles.decorator';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @Get('most-rented')
  @ApiOperation({
    summary: 'Lista as quadras mais alugadas (apenas para proprietários)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Status da quadra',
    enum: ['PAGO_PRESENCIALMENTE', 'PAGO_SPORTMAP'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista das quadras mais alugadas e valores recebidos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'ID da quadra' },
          totalRentals: { type: 'number', description: 'Total de aluguéis' },
          totalAmount: { type: 'number', description: 'Valor total recebido' },
        },
      },
    },
  })
  async getMostRentedCourts(@Query('status') status?: string) {
    return this.dashboardsService.getMostRentedCourts(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @Get('reservations/active/owner')
  @ApiOperation({
    summary: 'Quantidade total de reservas ativas do proprietário',
  })
  @ApiResponse({
    status: 200,
    description: 'Quantidade de reservas ativas do owner',
    schema: {
      type: 'object',
      properties: { activeReservations: { type: 'number' } },
    },
  })
  async getActiveReservationsCountByOwner(@Req() req) {
    const activeReservations =
      await this.dashboardsService.getActiveReservationsCountByOwner(
        req.user.id,
      );
    return { activeReservations };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @Get('reservations/active/by-court')
  @ApiOperation({
    summary: 'Quantidade de reservas ativas por quadra do proprietário',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de quadras com quantidade de reservas ativas',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          court: { type: 'object', description: 'Dados da quadra' },
          activeReservations: {
            type: 'number',
            description: 'Reservas ativas',
          },
        },
      },
    },
  })
  async getActiveReservationsCountByCourt(@Req() req) {
    return this.dashboardsService.getActiveReservationsCountByCourt(
      req.user.id,
    );
  }
}
