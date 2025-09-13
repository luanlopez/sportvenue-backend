import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { ConfigModule } from '@nestjs/config';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@Module({
  imports: [ConfigModule],
  controllers: [PlacesController],
  providers: [PlacesService, LokiLoggerService],
  exports: [PlacesService],
})
export class PlacesModule {}
