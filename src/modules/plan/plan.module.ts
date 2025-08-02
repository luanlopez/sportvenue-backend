import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtModule } from '../court/court.module';
import { UsersModule } from '../users/users.module';
import { PlanController } from './plan.controller';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';
import { PlanSchema } from 'src/schema/plan.schema';
import { PlanService } from './plan.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plan', schema: PlanSchema }]),
    forwardRef(() => CourtModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SubscriptionsModule),
    LokiLoggerModule,
  ],
  providers: [PlanService],
  controllers: [PlanController],
  exports: [PlanService],
})
export class PlanModule {}
