import { Module, forwardRef } from '@nestjs/common';
import { CourtService } from './court.service';
import { CourtController } from './court.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Court, CourtSchema } from './entities/court.entity';
import { ImageKitModule } from '../common/imagekit/imagekit.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@Module({
  imports: [
    ImageKitModule,
    MongooseModule.forFeature([{ name: Court.name, schema: CourtSchema }]),
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [CourtService, LokiLoggerService],
  controllers: [CourtController],
  exports: [CourtService],
})
export class CourtModule {}
