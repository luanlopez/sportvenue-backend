import { Injectable } from '@nestjs/common';

@Injectable()
export class MockLokiLoggerService {
  async info(message: string, labels: any = {}) {}

  async error(message: string, error?: Error, labels: any = {}) {}

  async debug(message: string, labels: any = {}) {}
}
