import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingSchema } from 'src/schema/billing.schema';
import { DashboardsService } from './dashboards.service';
import { DashboardsController } from './dashboards.controller';
import { ReservationSchema } from 'src/schema/reservation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Billing', schema: BillingSchema },
      { name: 'Reservation', schema: ReservationSchema },
    ]),
  ],
  providers: [DashboardsService],
  controllers: [DashboardsController],
})
export class DashboardsModule {}
