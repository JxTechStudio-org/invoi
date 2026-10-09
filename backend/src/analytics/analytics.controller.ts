import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { AnalyticsRequestDto } from './dto/analytics.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post()
  run(@Req() req: any, @Body() dto: AnalyticsRequestDto) {
    return this.analytics.run(req.user.userId, dto);
  }
}