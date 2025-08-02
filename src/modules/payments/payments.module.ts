import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from '../../schema/payment.schema';
import { UserSchema } from 'src/schema/user.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '../users/users.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ResendModule } from '../common/resend/resend.module';
import { CourtModule } from '../court/court.module';
import { PlanModule } from '../plan/plan.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: 'User', schema: UserSchema },
    ]),
    UsersModule,
    ResendModule,
    CourtModule,
    PlanModule,
    SubscriptionsModule,
    NotificationModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
