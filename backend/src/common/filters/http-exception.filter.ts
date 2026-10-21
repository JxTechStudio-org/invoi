import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseObject {
  message?: string | string[];
  error?: string;
  [key: string]: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

    // Client errors are expected; server errors are hidden from the client, so they must be logged.
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl ?? request.url} failed with ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: error,
    });
  }
}