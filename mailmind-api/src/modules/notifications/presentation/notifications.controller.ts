import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { NotificationsService } from '../application/notifications.service';

@UseGuards(JwtAccessGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  @Get()
  list(
    @Req() req: Request,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.list(this.uid(req), {
      unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('unread-count')
  async unreadCount(@Req() req: Request) {
    const count = await this.svc.unreadCount(this.uid(req));
    return { count };
  }

  @Post(':id/read')
  markRead(@Req() req: Request, @Param('id') id: string) {
    return this.svc.markRead(this.uid(req), id);
  }

  @Post('read-all')
  markAllRead(@Req() req: Request) {
    return this.svc.markAllRead(this.uid(req));
  }
}
