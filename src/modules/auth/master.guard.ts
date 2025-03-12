import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LokiLoggerService } from 'src/common/logger/loki-logger.service';

@Injectable()
export class MasterGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private readonly lokiLogger: LokiLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const masterKey = request.headers['x-master-key'];
    const configuredMasterKey = this.configService.get<string>('MASTER_KEY');

    if (!configuredMasterKey) {
      await this.lokiLogger.error('MASTER_KEY not configured in environment');
      throw new UnauthorizedException('Master key not configured');
    }

    if (!masterKey) {
      await this.lokiLogger.error(
        'No master key provided in request',
        new Error('Master key is required'),
        {
          endpoint: request.path,
          method: request.method,
        },
      );
      throw new UnauthorizedException('Master key is required');
    }

    if (masterKey === configuredMasterKey) {
      await this.lokiLogger.info('Access granted - Valid master key', {
        endpoint: request.path,
        method: request.method,
      });
      return true;
    }

    await this.lokiLogger.error(
      'Access denied - Invalid master key',
      new Error('Invalid master key'),
      {
        endpoint: request.path,
        method: request.method,
      },
    );

    throw new UnauthorizedException('Invalid master key');
  }
}
