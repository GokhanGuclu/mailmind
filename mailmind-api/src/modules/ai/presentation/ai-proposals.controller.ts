import { BadRequestException, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import {
  AiProposalsService,
  type ProposalKind,
} from '../application/ai-proposals.service';

const ALLOWED_KINDS: ProposalKind[] = ['task', 'calendar-event', 'reminder'];

@UseGuards(JwtAccessGuard)
@Controller('ai/proposals')
export class AiProposalsController {
  constructor(private readonly svc: AiProposalsService) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  private parseKind(raw: string): ProposalKind {
    if (!ALLOWED_KINDS.includes(raw as ProposalKind)) {
      throw new BadRequestException(
        `kind must be one of ${ALLOWED_KINDS.join(', ')}`,
      );
    }
    return raw as ProposalKind;
  }

  @Get()
  list(@Req() req: Request) {
    return this.svc.list(this.uid(req));
  }

  @Get('count')
  count(@Req() req: Request) {
    return this.svc.count(this.uid(req));
  }

  @Post(':kind/:id/approve')
  approve(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    return this.svc.approve(this.uid(req), this.parseKind(kind), id);
  }

  @Post(':kind/:id/reject')
  reject(
    @Req() req: Request,
    @Param('kind') kind: string,
    @Param('id') id: string,
  ) {
    return this.svc.reject(this.uid(req), this.parseKind(kind), id);
  }
}
