import { ArgumentsHost, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('Global exception filter', () => {
  let logError: jest.SpyInstance;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    json = jest.fn();
    status = jest.fn(() => ({ json }));
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', originalUrl: '/api/invoices/abc' }),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    logError.mockRestore();
  });

  it('logs unexpected errors with their stack but hides details from the client', () => {
    const error = new Error('database connection lost');
    new AllExceptionsFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500, message: 'Internal server error', error: 'Internal Server Error',
    });
    expect(logError).toHaveBeenCalledWith('GET /api/invoices/abc failed with 500', error.stack);
  });

  it('logs explicit server errors', () => {
    new AllExceptionsFilter().catch(new InternalServerErrorException('Invoice deleted but file cleanup failed'), host);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('does not log client errors', () => {
    new AllExceptionsFilter().catch(new BadRequestException('bad input'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(logError).not.toHaveBeenCalled();
  });
});
