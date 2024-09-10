import { Module } from '@nestjs/common';
import { CourtService } from './court.service';
import { CourtController } from './court.controller';
import { AppwriteModule } from '../common/appwrite/appwrite.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtSchema } from 'src/schema/court.schema';

@Module({
  imports: [
    AppwriteModule,
    MongooseModule.forFeature([{ name: 'Court', schema: CourtSchema }]),
  ],
  providers: [CourtService],
  controllers: [CourtController],
})
export class CourtModule {}
