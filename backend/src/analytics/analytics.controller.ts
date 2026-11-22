import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { AnalyticsRequestDto } from './dto/analytics.dto';
import { AnalyticsService } from './analytics.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post()
  run(@Req() req: AuthenticatedRequest, @Body() dto: AnalyticsRequestDto) {
    return this.analytics.run(req.user.userId, dto);
  }
}
