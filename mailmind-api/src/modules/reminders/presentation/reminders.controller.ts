import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { RemindersService } from '../application/reminders.service';
import { CreateReminderDto } from '../application/dto/create-reminder.dto';
import { UpdateReminderDto } from '../application/dto/update-reminder.dto';

@UseGuards(JwtAccessGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly svc: RemindersService) {}

  private uid(req: Request): string {
    return (req as any).user?.id;
  }

  @Get()
  list(@Req() req: Request, @Query('status') status?: string) {
    return this.svc.list(this.uid(req), status);
  }

  @Get(':id')
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.svc.getOne(this.uid(req), id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateReminderDto) {
    return this.svc.create(this.uid(req), dto);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateReminderDto) {
    return this.svc.update(this.uid(req), id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.svc.remove(this.uid(req), id);
  }
}
