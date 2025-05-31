import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';
import { Event, EventSchema } from 'src/schema/events.schema';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  controllers: [EventsController],
  providers: [EventsService, LokiLoggerService],
  exports: [EventsService],
})
export class EventsModule {}
