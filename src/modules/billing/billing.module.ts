import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingService } from './billing.service';
import { BillingSchema } from '../../schema/billing.schema';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';
import { InvoiceSchema } from 'src/schema/invoice.schema';
import { BillingController } from './billing.controller';
import { BillingCronService } from './billing.cron';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Billing', schema: BillingSchema },
      { name: 'Invoice', schema: InvoiceSchema },
    ]),
    LokiLoggerModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingCronService],
  exports: [BillingService],
})
export class BillingModule {}
