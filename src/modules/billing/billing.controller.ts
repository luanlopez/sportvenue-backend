import {
  Controller,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpdateBillingDTO } from './dtos/update-billing.dto';
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
}
