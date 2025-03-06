import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LokiLoggerService } from './loki-logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LokiLoggerService],
  exports: [LokiLoggerService],
})
export class LokiLoggerModule {}
