import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationSchema } from 'src/schema/reservation.schema';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { CourtModule } from '../court/court.module';
import { ResendModule } from '../common/resend/resend.module';
import { LokiLoggerModule } from 'src/common/logger/loki-logger.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Reservation', schema: ReservationSchema },
    ]),
    CourtModule,
    ResendModule,
    LokiLoggerModule,
    BillingModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
