import { Module } from '@nestjs/common';
import { CourtService } from './court.service';
import { CourtController } from './court.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtSchema } from 'src/schema/court.schema';
import { ImageKitModule } from '../common/imagekit/imagekit.module';
import { ClerkModule } from '../common/clerk/clerk.module';

@Module({
  imports: [
    ImageKitModule,
    ClerkModule,
    MongooseModule.forFeature([{ name: 'Court', schema: CourtSchema }]),
  ],
  providers: [CourtService],
  controllers: [CourtController],
})
export class CourtModule {}
