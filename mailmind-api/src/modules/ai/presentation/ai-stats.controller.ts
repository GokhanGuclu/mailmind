import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { AiStatsService } from '../application/ai-stats.service';

@UseGuards(JwtAccessGuard)
@Controller('ai/stats')
export class AiStatsController {
  constructor(private readonly svc: AiStatsService) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  @Get()
  summary(@Req() req: Request, @Query('days') days?: string) {
    const n = days ? Number(days) : undefined;
    return this.svc.summary(this.uid(req), Number.isFinite(n) ? n : undefined);
  }
}
