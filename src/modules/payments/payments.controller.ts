import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDTO } from './dtos/create-payment-intent.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
    @Body() body: any,
  ) {
    return this.paymentsService.handleWebhook(signature, body);
  }
}
