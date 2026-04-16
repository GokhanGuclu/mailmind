import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { CalendarService } from '../application/calendar.service';
import { CreateCalendarEventDto } from '../application/dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../application/dto/update-calendar-event.dto';

@UseGuards(JwtAccessGuard)
@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly svc: CalendarService) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  @Get()
  list(@Req() req: Request) {
    return this.svc.list(this.uid(req));
  }

  @Get(':id')
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.svc.getOne(this.uid(req), id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCalendarEventDto) {
    return this.svc.create(this.uid(req), dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.svc.update(this.uid(req), id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.svc.remove(this.uid(req), id);
  }
}
