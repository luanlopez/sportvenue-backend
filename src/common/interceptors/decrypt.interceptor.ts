import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class DecryptInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DecryptInterceptor.name);

  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body && request.body.encryptedData) {
      try {
        const secretKey = this.configService.get<string>('CRYPTO_SECRET_KEY');
        
        if (!secretKey) {
          this.logger.error('CRYPTO_SECRET_KEY not found in environment variables');
          throw new Error('Encryption key not configured');
        }

        const bytes = CryptoJS.AES.decrypt(request.body.encryptedData, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedData) {
          throw new Error('Failed to decrypt data');
        }

        request.body = JSON.parse(decryptedData);
        this.logger.debug('Request data decrypted successfully');
      } catch (error) {
        this.logger.error('Failed to decrypt request data:', error?.message);
        throw new BadRequestException('Failed to decrypt request data');
      }
    }

    return next.handle();
  }
} 