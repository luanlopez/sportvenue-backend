import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../../schema/payment.schema';
import { PaymentsCronService } from './payments-cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ResendModule } from '../common/resend/resend.module';
import { CourtModule } from '../court/court.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    UsersModule,
    ResendModule,
    CourtModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsCronService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
