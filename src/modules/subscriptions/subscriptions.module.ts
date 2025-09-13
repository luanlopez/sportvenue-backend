import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { CourtModule } from '../court/court.module';
import SubscriptionSchema from 'src/schema/subscription.schema';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Subscription', schema: SubscriptionSchema },
    ]),
    forwardRef(() => CourtModule),
    forwardRef(() => UsersModule),
    forwardRef(() => PlanModule),
    LokiLoggerModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
