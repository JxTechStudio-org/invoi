import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function corsOptions(allowedOrigins: string | undefined): CorsOptions {
  return {
    origin: (allowedOrigins ?? '').split(',').map(origin => origin.trim()).filter(Boolean),
    credentials: false,
  };
}
