import { ReminderSchedulerService } from './reminder-scheduler.service';
import { RecurrenceDetectorService } from './recurrence-detector.service';

describe('ReminderSchedulerService.tick()', () => {
  let reminderFindMany: jest.Mock;
  let reminderUpdateMany: jest.Mock;
  let notificationCreate: jest.Mock;
  let svc: ReminderSchedulerService;

  beforeEach(() => {
    reminderFindMany = jest.fn();
    // Default: claim succeeds (count=1). Tests can override per-call.
    reminderUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    notificationCreate = jest.fn().mockResolvedValue({});

    // $transaction(callback) pattern. tx exposes the same updateMany/create.
    const prisma = {
      reminder: { findMany: reminderFindMany, updateMany: reminderUpdateMany },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          reminder: { updateMany: reminderUpdateMany },
          notification: { create: notificationCreate },
        }),
      ),
    } as any;

    const recurrence = new RecurrenceDetectorService();
    const notifications = { create: jest.fn() } as any;

    svc = new ReminderSchedulerService(prisma, recurrence, notifications);
  });

  it('returns 0 when no due reminders', async () => {
    reminderFindMany.mockResolvedValue([]);
    const fired = await svc.tick(new Date('2026-04-25T10:00:00Z'));
    expect(fired).toBe(0);
    expect(reminderUpdateMany).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
  });

  it('one-shot reminder: claim succeeds → COMPLETED, no nextFireAt, notification created', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    const dueAt = new Date('2026-04-25T09:00:00Z');
    reminderFindMany.mockResolvedValue([
      {
        id: 'r1',
        userId: 'u1',
        title: 'Doctor appointment',
        rrule: null,
        fireAt: dueAt,
        nextFireAt: dueAt,
      },
    ]);

    const fired = await svc.tick(now);

    expect(fired).toBe(1);
    const claim = reminderUpdateMany.mock.calls[0][0];
    // Atomic claim: where guards on (id, status=ACTIVE, nextFireAt unchanged)
    expect(claim.where).toEqual({ id: 'r1', status: 'ACTIVE', nextFireAt: dueAt });
    expect(claim.data.lastFiredAt).toBe(now);
    expect(claim.data.nextFireAt).toBeNull();
    expect(claim.data.status).toBe('COMPLETED');

    const notif = notificationCreate.mock.calls[0][0].data;
    expect(notif.type).toBe('REMINDER_FIRED');
    expect(notif.sourceType).toBe('reminder');
    expect(notif.sourceId).toBe('r1');
    expect(notif.title).toBe('Doctor appointment');
  });

  it('recurring reminder: stays ACTIVE and advances nextFireAt', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    const dueAt = new Date('2026-04-25T09:00:00Z');
    reminderFindMany.mockResolvedValue([
      {
        id: 'r2',
        userId: 'u1',
        title: 'Daily medication',
        rrule: 'FREQ=DAILY',
        fireAt: null,
        nextFireAt: dueAt,
      },
    ]);

    await svc.tick(now);

    const claim = reminderUpdateMany.mock.calls[0][0];
    expect(claim.where.nextFireAt).toBe(dueAt); // race guard
    expect(claim.data.status).toBe('ACTIVE');
    expect(claim.data.nextFireAt).toBeInstanceOf(Date);
    expect((claim.data.nextFireAt as Date).getTime()).toBeGreaterThan(dueAt.getTime());

    const notif = notificationCreate.mock.calls[0][0].data;
    expect(notif.body).toContain('Tekrarlayan');
    expect(notif.body).toContain('Sıradaki');
  });

  it('race lost (claim count=0): no notification created, fired count not incremented', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    reminderFindMany.mockResolvedValue([
      {
        id: 'rRaced',
        userId: 'u1',
        title: 'Already fired',
        rrule: null,
        fireAt: now,
        nextFireAt: now,
      },
    ]);
    // Simulate another worker beat us: updateMany affects 0 rows
    reminderUpdateMany.mockResolvedValueOnce({ count: 0 });

    const fired = await svc.tick(now);

    expect(fired).toBe(0); // we did NOT win
    expect(reminderUpdateMany).toHaveBeenCalledTimes(1);
    expect(notificationCreate).not.toHaveBeenCalled(); // tx returned false before create
  });

  it('mixed batch: 1 wins claim, 1 loses race → fired=1, exactly 1 notification', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    reminderFindMany.mockResolvedValue([
      { id: 'rOk', userId: 'u1', title: 'OK', rrule: null, fireAt: now, nextFireAt: now },
      { id: 'rRaced', userId: 'u1', title: 'Raced', rrule: null, fireAt: now, nextFireAt: now },
    ]);
    reminderUpdateMany
      .mockResolvedValueOnce({ count: 1 }) // first wins
      .mockResolvedValueOnce({ count: 0 }); // second lost race

    const fired = await svc.tick(now);

    expect(fired).toBe(1);
    expect(reminderUpdateMany).toHaveBeenCalledTimes(2);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
  });

  it('one tx failure does not block other reminders in the batch', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    reminderFindMany.mockResolvedValue([
      { id: 'rOk', userId: 'u1', title: 'OK', rrule: null, fireAt: now, nextFireAt: now },
      { id: 'rBad', userId: 'u1', title: 'Bad', rrule: null, fireAt: now, nextFireAt: now },
    ]);

    let callCount = 0;
    (svc as any).prisma.$transaction = jest.fn(async (cb: any) => {
      callCount++;
      if (callCount === 2) throw new Error('boom');
      return cb({
        reminder: { updateMany: reminderUpdateMany },
        notification: { create: notificationCreate },
      });
    });

    const fired = await svc.tick(now);

    expect(fired).toBe(1);
  });
});
