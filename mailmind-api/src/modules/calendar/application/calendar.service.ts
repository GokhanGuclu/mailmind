import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        location: true,
        attendees: true,
        status: true,
        aiAnalysisId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getOne(userId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Calendar event not found.');
    if (event.userId !== userId) throw new ForbiddenException();
    return event;
  }

  async create(userId: string, dto: CreateCalendarEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        location: dto.location ?? null,
        attendees: dto.attendees ? JSON.stringify(dto.attendees) : null,
      },
    });
  }

  async update(userId: string, eventId: string, dto: UpdateCalendarEventDto) {
    await this.assertOwnership(userId, eventId);
    return this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startAt !== undefined && { startAt: new Date(dto.startAt) }),
        ...(dto.endAt !== undefined && { endAt: new Date(dto.endAt) }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.attendees !== undefined && { attendees: JSON.stringify(dto.attendees) }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async remove(userId: string, eventId: string) {
    await this.assertOwnership(userId, eventId);
    await this.prisma.calendarEvent.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  private async assertOwnership(userId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: { userId: true },
    });
    if (!event) throw new NotFoundException('Calendar event not found.');
    if (event.userId !== userId) throw new ForbiddenException();
  }
}
