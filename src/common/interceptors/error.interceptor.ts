import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomApiError } from '../errors/custom-api.error';
import { ApiMessages } from '../messages/api-messages';

@Catch()
export class ErrorInterceptor implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (error instanceof CustomApiError) {
      return response.status(error.statusCode).json({
        title: error.title,
        message: error.message,
        code: error.code,
      });
    }

    if (error instanceof HttpException) {
      return response.status(error.getStatus()).json({
        title: ApiMessages.Generic.RequestError.title,
        message: error.message,
        code: `HTTP_${error.getStatus()}`,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      title: ApiMessages.Generic.InternalError.title,
      message: ApiMessages.Generic.InternalError.message,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}
