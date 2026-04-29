import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RecurrenceDetectorService } from '../../ai/application/recurrence-detector.service';
import { UpdatableReminderStatus } from './dto/update-reminder.dto';

describe('RemindersService', () => {
  let reminder: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let iamUser: { findUnique: jest.Mock };
  let svc: RemindersService;

  beforeEach(() => {
    reminder = {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data })),
      update: jest.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      ),
      delete: jest.fn().mockResolvedValue({}),
    };
    iamUser = {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'Europe/Istanbul' }),
    };
    const prisma = { reminder, iamUser } as any;
    svc = new RemindersService(prisma, new RecurrenceDetectorService());
  });

  describe('list()', () => {
    it('default filter excludes PROPOSED (proposals akışı ayrı)', async () => {
      await svc.list('u1');
      const where = reminder.findMany.mock.calls[0][0].where;
      expect(where.userId).toBe('u1');
      expect(where.status.in).toEqual(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']);
    });

    it('respects explicit status filter and ignores invalid tokens', async () => {
      await svc.list('u1', 'ACTIVE,UNKNOWN,paused');
      const where = reminder.findMany.mock.calls[0][0].where;
      expect(where.status.in).toEqual(['ACTIVE', 'PAUSED']);
    });

    it('falls back to default when status filter is empty after sanitization', async () => {
      await svc.list('u1', 'NOPE,GARBAGE');
      const where = reminder.findMany.mock.calls[0][0].where;
      expect(where.status.in).toEqual(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']);
    });
  });

  describe('create()', () => {
    it('rejects when neither fireAt nor rrule provided', async () => {
      await expect(svc.create('u1', { title: 'x' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(reminder.create).not.toHaveBeenCalled();
    });

    it('one-shot create: status=ACTIVE, nextFireAt=fireAt, rrule=null', async () => {
      const fireAt = new Date('2026-05-10T08:00:00Z').toISOString();
      await svc.create('u1', { title: 'Doctor', fireAt } as any);

      const data = reminder.create.mock.calls[0][0].data;
      expect(data.status).toBe('ACTIVE');
      expect((data.fireAt as Date).toISOString()).toBe(fireAt);
      expect((data.nextFireAt as Date).toISOString()).toBe(fireAt);
      expect(data.rrule).toBeNull();
      expect(data.timezone).toBe('Europe/Istanbul');
    });

    it('recurring create: validates rrule, strips RRULE: prefix, computes nextFireAt', async () => {
      await svc.create('u1', { title: 'Daily', rrule: 'RRULE:FREQ=DAILY' } as any);
      const data = reminder.create.mock.calls[0][0].data;
      expect(data.rrule).toBe('FREQ=DAILY'); // prefix stripped
      expect(data.nextFireAt).toBeInstanceOf(Date);
    });

    it('rejects invalid rrule (non-RFC5545 BYDAY)', async () => {
      await expect(
        svc.create('u1', { title: 'x', rrule: 'FREQ=WEEKLY;BYDAY=FRI' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uses dto.timezone over user timezone when provided', async () => {
      await svc.create('u1', {
        title: 't',
        fireAt: '2026-05-10T08:00:00Z',
        timezone: 'America/New_York',
      } as any);
      const data = reminder.create.mock.calls[0][0].data;
      expect(data.timezone).toBe('America/New_York');
    });
  });

  describe('update()', () => {
    function setupExisting(extra: Partial<any> = {}) {
      reminder.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        title: 'old',
        notes: null,
        fireAt: null,
        rrule: 'FREQ=DAILY',
        nextFireAt: new Date('2026-05-10T08:00:00Z'),
        status: 'ACTIVE',
        ...extra,
      });
    }

    it('throws NotFound when missing', async () => {
      reminder.findUnique.mockResolvedValue(null);
      await expect(svc.update('u1', 'rX', { title: 't' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Forbidden across tenants', async () => {
      setupExisting({ userId: 'uOther' });
      await expect(svc.update('u1', 'r1', { title: 't' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('clears rrule when set to null and falls back nextFireAt to fireAt', async () => {
      const fireAt = new Date('2026-06-01T09:00:00Z');
      setupExisting({ fireAt, rrule: 'FREQ=DAILY' });

      await svc.update('u1', 'r1', { rrule: null, fireAt: fireAt.toISOString() } as any);

      const data = reminder.update.mock.calls[0][0].data;
      expect(data.rrule).toBeNull();
      expect((data.nextFireAt as Date).toISOString()).toBe(fireAt.toISOString());
    });

    it('rejects invalid new rrule', async () => {
      setupExisting();
      await expect(
        svc.update('u1', 'r1', { rrule: 'FREQ=WEEKLY;BYDAY=MON' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('status pause via UpdatableReminderStatus', async () => {
      setupExisting();
      await svc.update('u1', 'r1', { status: UpdatableReminderStatus.PAUSED });
      const data = reminder.update.mock.calls[0][0].data;
      expect(data.status).toBe('PAUSED');
    });
  });

  describe('remove()', () => {
    it('deletes own reminder', async () => {
      reminder.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1' });
      const out = await svc.remove('u1', 'r1');
      expect(out).toEqual({ deleted: true });
      expect(reminder.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });

    it('forbids deletion across tenants', async () => {
      reminder.findUnique.mockResolvedValue({ id: 'r1', userId: 'uOther' });
      await expect(svc.remove('u1', 'r1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(reminder.delete).not.toHaveBeenCalled();
    });
  });
});
