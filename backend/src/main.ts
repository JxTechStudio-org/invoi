import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { corsOptions } from './cors.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // for rate limiting: enable trust proxy for accurate rate limiting behind reverse proxies
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  app.enableCors(corsOptions(process.env.CORS_ALLOWED_ORIGINS));
  const frontendDistPath = join(__dirname, '..', '..', 'frontend', 'dist');
  const frontendIndexPath = join(frontendDistPath, 'index.html');

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (existsSync(frontendIndexPath)) {
    app.useStaticAssets(frontendDistPath);
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        return next();
      }

      return res.sendFile(frontendIndexPath);
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
