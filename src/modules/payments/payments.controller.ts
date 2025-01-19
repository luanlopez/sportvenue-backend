import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDTO } from './dtos/create-payment-intent.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserInterface } from '../auth/strategies/interfaces/user.interface';
import { User } from '../auth/user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar intenção de pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Intenção de pagamento criada com sucesso',
  })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDTO,
  ) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook do Stripe' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(signature, request.rawBody);
  }

  @Get('boletos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOUSE_OWNER')
  @ApiOperation({ summary: 'Listar boletos do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de boletos retornada com sucesso',
  })
  async listUserBoletos(@User() user: UserInterface) {
    return this.paymentsService.getUserBoletos(user.id);
  }
}
