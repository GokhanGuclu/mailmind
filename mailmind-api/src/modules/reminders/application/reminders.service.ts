import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, ReminderStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { RecurrenceDetectorService } from '../../ai/application/recurrence-detector.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto, UpdatableReminderStatus } from './dto/update-reminder.dto';

const ALLOWED_LIST_STATUSES = new Set<ReminderStatus>([
  'PROPOSED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]);

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recurrence: RecurrenceDetectorService,
  ) {}

  /**
   * Listeleme. Varsayılan: PROPOSED hariç tüm durumlar (proposals akışı
   * /ai/proposals üstünden ele alınıyor; bu sayfa "kullanıcı yönetimindeki"
   * reminder'lar içindir).
   */
  async list(userId: string, statusFilter?: string) {
    const where: Prisma.ReminderWhereInput = { userId };

    const requested = statusFilter
      ? statusFilter
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter((s): s is ReminderStatus =>
            ALLOWED_LIST_STATUSES.has(s as ReminderStatus),
          )
      : [];

    where.status =
      requested.length > 0
        ? { in: requested }
        : { in: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] }; // default: PROPOSED hariç

    return this.prisma.reminder.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // ACTIVE / PAUSED üstte enum ordinaline göre
        { nextFireAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });
  }

  async getOne(userId: string, id: string) {
    const r = await this.prisma.reminder.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reminder not found.');
    if (r.userId !== userId) throw new ForbiddenException();
    return r;
  }

  async create(userId: string, dto: CreateReminderDto) {
    if (!dto.fireAt && !dto.rrule) {
      throw new BadRequestException('Either fireAt or rrule must be provided.');
    }

    // Kullanıcının timezone'unu fallback olarak kullan
    const userRow = await this.prisma.iamUser.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = dto.timezone ?? userRow?.timezone ?? 'Europe/Istanbul';

    const fireAt = dto.fireAt ? new Date(dto.fireAt) : null;
    let validatedRrule: string | null = null;
    let nextFireAt: Date | null = fireAt;

    if (dto.rrule) {
      const v = this.recurrence.validate(dto.rrule, fireAt ?? new Date());
      if (!v.ok) {
        throw new BadRequestException(`Invalid rrule: ${v.error}`);
      }
      validatedRrule = dto.rrule.replace(/^RRULE:/i, '').trim();
      nextFireAt = v.nextFireAt;
    }

    return this.prisma.reminder.create({
      data: {
        userId,
        title: dto.title,
        notes: dto.notes ?? null,
        fireAt,
        rrule: validatedRrule,
        timezone,
        nextFireAt,
        status: 'ACTIVE', // manuel oluşturulan = zaten onaylı
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    const existing = await this.assertOwnership(userId, id);

    const data: Prisma.ReminderUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;

    // fireAt / rrule değişince nextFireAt'ı yeniden hesapla.
    let recomputeNext = false;
    let newFireAt: Date | null = existing.fireAt;
    let newRrule: string | null = existing.rrule;

    if (dto.fireAt !== undefined) {
      newFireAt = dto.fireAt ? new Date(dto.fireAt) : null;
      data.fireAt = newFireAt;
      recomputeNext = true;
    }
    if (dto.rrule !== undefined) {
      if (dto.rrule === null || dto.rrule === '') {
        newRrule = null;
        data.rrule = null;
      } else {
        const v = this.recurrence.validate(dto.rrule, newFireAt ?? new Date());
        if (!v.ok) {
          throw new BadRequestException(`Invalid rrule: ${v.error}`);
        }
        newRrule = dto.rrule.replace(/^RRULE:/i, '').trim();
        data.rrule = newRrule;
      }
      recomputeNext = true;
    }

    if (recomputeNext) {
      if (newRrule) {
        const next = this.recurrence.computeNextFireAt(newRrule, new Date());
        data.nextFireAt = next;
      } else {
        data.nextFireAt = newFireAt;
      }
    }

    if (dto.status !== undefined) {
      data.status = this.mapUpdatableStatus(dto.status);
    }

    return this.prisma.reminder.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.reminder.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private mapUpdatableStatus(s: UpdatableReminderStatus): ReminderStatus {
    return s as ReminderStatus;
  }

  private async assertOwnership(userId: string, id: string) {
    const r = await this.prisma.reminder.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Reminder not found.');
    if (r.userId !== userId) throw new ForbiddenException();
    return r;
  }
}
