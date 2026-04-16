import { Controller, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { AiAnalysisRepository } from '../infrastructure/persistence/ai-analysis.repository.prisma';

@UseGuards(JwtAccessGuard)
@Controller('ai/analyses')
export class AiAnalysisController {
  constructor(private readonly repo: AiAnalysisRepository) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  /** GET /ai/analyses — kullanıcının tüm analiz kayıtları */
  @Get()
  list(@Req() req: Request) {
    return this.repo.findByUser(this.uid(req));
  }

  /** GET /ai/analyses/:id — analiz detayı (task + event'lerle birlikte) */
  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const analysis = await this.repo.findOneByUser(this.uid(req), id);
    if (!analysis) throw new NotFoundException('Analysis not found.');
    return analysis;
  }
}
