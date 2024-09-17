import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationSchema } from 'src/schema/reservation.schema';
import { ResendModule } from '../common/resend/resend.module';
import { ClerkModule } from '../common/clerk/clerk.module';

@Module({
  imports: [
    ResendModule,
    ClerkModule,
    MongooseModule.forFeature([
      { name: 'Reservation', schema: ReservationSchema },
    ]),
  ],
  providers: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
