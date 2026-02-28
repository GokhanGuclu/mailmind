import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';

import { MailboxAccountsService } from '../application/mailbox-accounts.service';
import { CreateMailboxAccountDto } from '../application/dto/create-mailbox-account.dto';
import { ActivateMailboxAccountDto } from '../application/dto/activate-mailbox-account.dto';

@UseGuards(JwtAccessGuard)
@Controller('mailbox/accounts')
export class MailboxAccountsController {
  constructor(private readonly svc: MailboxAccountsService) {}

  private getUserId(req: Request): string {

    const userId = (req as any).user.id;
    if (!userId) {
      throw new Error('JwtAccessGuard did not attach user id on req.user');
    }
    return userId;
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateMailboxAccountDto) {
    return this.svc.create(this.getUserId(req), dto);
  }

  @Get()
  list(@Req() req: Request) {
    return this.svc.list(this.getUserId(req));
  }

  @Post(':id/activate')
  activate(@Req() req: Request, @Param('id') id: string, @Body() dto: ActivateMailboxAccountDto) {
    return this.svc.activate(this.getUserId(req), id, dto);
  }

  @Post(':id/revoke')
  revoke(@Req() req: Request, @Param('id') id: string) {
    return this.svc.revoke(this.getUserId(req), id);
  }
}