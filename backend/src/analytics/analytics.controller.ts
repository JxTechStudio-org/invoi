import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
    return this.analytics.createJob(req.user.userId, dto);
  }

  @Get('latest')
  getLatest(@Req() req: AuthenticatedRequest) {
    return this.analytics.getLatest(req.user.userId);
  }

  @Get('jobs/:id')
  getJob(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.analytics.getJob(req.user.userId, id);
  }
}
