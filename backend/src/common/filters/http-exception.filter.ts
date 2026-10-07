import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseObject {
  message?: string | string[];
  error?: string;
  [key: string]: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.error('🚨 REAL EXCEPTION CAUSE:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse
        ? (errorResponse as ErrorResponseObject).message
        : errorResponse;

    const error =
      typeof errorResponse === 'object' && errorResponse !== null && 'error' in errorResponse
        ? (errorResponse as ErrorResponseObject).error
        : exception instanceof HttpException
          ? exception.name
          : 'Internal Server Error';

    response.status(status).json({
      statusCode: status,
      message: message,
      error: error,
    });
  }
}