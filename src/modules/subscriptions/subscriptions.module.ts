import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionPlanSchema } from '../../schema/subscription-plan.schema';
import { CourtModule } from '../court/court.module';
import { SubscriptionsService } from './subscriptions.service';
import { UsersModule } from '../users/users.module';
import { SubscriptionsController } from './subscriptions.controller';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'SubscriptionPlan', schema: SubscriptionPlanSchema },
    ]),
    forwardRef(() => CourtModule),
    forwardRef(() => UsersModule),
    LokiLoggerModule,
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
