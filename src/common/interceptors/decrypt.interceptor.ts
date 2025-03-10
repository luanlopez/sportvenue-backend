import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class DecryptInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DecryptInterceptor.name);

  constructor(private configService: ConfigService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { body, path, method } = request;

    this.logger.debug(`Receiving ${method} request to ${path}`);

    if (!body) {
      this.logger.debug('No body in request, skipping decryption');
      return next.handle();
    }

    if (!body.encryptedData) {
      this.logger.debug('No encrypted data in body, skipping decryption');
      return next.handle();
    }

    try {
      if (typeof body.encryptedData !== 'string') {
        throw new BadRequestException('Encrypted data must be a string');
      }

      const secretKey = this.configService.get<string>('CRYPTO_SECRET_KEY');

      if (!secretKey) {
        this.logger.error(
          'CRYPTO_SECRET_KEY not found in environment variables',
        );
        throw new Error('Encryption key not configured');
      }

      const maskedKey =
        secretKey.length > 4
          ? `${secretKey.substring(0, 2)}***${secretKey.substring(secretKey.length - 2)}`
          : '***';

      this.logger.debug('Attempting to decrypt data', {
        path,
        method,
        secretKey: maskedKey,
        encryptedDataLength: body.encryptedData.length,
      });

      const bytes = CryptoJS.AES.decrypt(body.encryptedData, secretKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        this.logger.error('Decryption resulted in empty data', {
          path,
          method,
          encryptedDataLength: body.encryptedData.length,
        });
        throw new Error('Decryption resulted in empty data');
      }

      try {
        request.body = JSON.parse(decryptedData);
        this.logger.debug('Data successfully decrypted and parsed');
      } catch (parseError) {
        this.logger.error('Failed to parse decrypted data as JSON', {
          path,
          method,
          decryptedData: decryptedData.substring(0, 100),
          error: parseError.message,
        });
        throw new Error('Invalid JSON in decrypted data');
      }
    } catch (error) {
      this.logger.error('Decryption failed', {
        path,
        method,
        errorType: error.constructor.name,
        errorMessage: error.message,
        encryptedDataSample: body.encryptedData?.substring(0, 50),
      });

      throw new BadRequestException(
        error instanceof BadRequestException
          ? error.message
          : 'Failed to process encrypted data. Please ensure the data is properly encrypted.',
      );
    }

    return next.handle();
  }
}
