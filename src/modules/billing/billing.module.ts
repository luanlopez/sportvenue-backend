import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingService } from './billing.service';
import { BillingSchema } from '../../schema/billing.schema';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';
import { InvoiceSchema } from 'src/schema/invoice.schema';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Billing', schema: BillingSchema }]),
    MongooseModule.forFeature([{ name: 'Invoice', schema: InvoiceSchema }]),
    LokiLoggerModule,
  ],
  controllers: [],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
