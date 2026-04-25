import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { DraftsService } from '../application/drafts.service';
import { SaveDraftDto } from '../application/dto/save-draft.dto';

@UseGuards(JwtAccessGuard)
@Controller('mailbox/accounts/:accountId/drafts')
export class DraftsController {
  constructor(private readonly svc: DraftsService) {}

  private getUserId(req: Request): string {
    const userId = (req as any).user?.id;
    if (!userId) throw new Error('JwtAccessGuard did not attach user id');
    return userId;
  }

  /** GET /mailbox/accounts/:accountId/drafts */
  @Get()
  list(@Req() req: Request, @Param('accountId') accountId: string) {
    return this.svc.list(this.getUserId(req), accountId);
  }

  /** GET /mailbox/accounts/:accountId/drafts/:id */
  @Get(':id')
  getOne(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
  ) {
    return this.svc.getOne(this.getUserId(req), accountId, id);
  }

  /** POST /mailbox/accounts/:accountId/drafts */
  @Post()
  create(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Body() dto: SaveDraftDto,
  ) {
    return this.svc.create(this.getUserId(req), accountId, dto);
  }

  /** PATCH /mailbox/accounts/:accountId/drafts/:id */
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: SaveDraftDto,
  ) {
    return this.svc.update(this.getUserId(req), accountId, id, dto);
  }

  /** DELETE /mailbox/accounts/:accountId/drafts/:id */
  @Delete(':id')
  remove(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Param('id') id: string,
  ) {
    return this.svc.remove(this.getUserId(req), accountId, id);
  }
}
