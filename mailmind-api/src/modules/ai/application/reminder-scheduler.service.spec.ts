import { ReminderSchedulerService } from './reminder-scheduler.service';
import { RecurrenceDetectorService } from './recurrence-detector.service';

describe('ReminderSchedulerService.tick()', () => {
  let reminderFindMany: jest.Mock;
  let reminderUpdate: jest.Mock;
  let notificationCreate: jest.Mock;
  let svc: ReminderSchedulerService;

  beforeEach(() => {
    reminderFindMany = jest.fn();
    reminderUpdate = jest.fn().mockResolvedValue({});
    notificationCreate = jest.fn().mockResolvedValue({});

    // $transaction(callback) pattern: pass tx with the same shape
    const prisma = {
      reminder: { findMany: reminderFindMany, update: reminderUpdate },
      $transaction: jest.fn(async (cb: any) =>
        cb({
          reminder: { update: reminderUpdate },
          notification: { create: notificationCreate },
        }),
      ),
    } as any;

    const recurrence = new RecurrenceDetectorService();
    // No-op notifications service — tick() uses prisma.notification.create directly inside tx
    const notifications = { create: jest.fn() } as any;

    svc = new ReminderSchedulerService(prisma, recurrence, notifications);
  });

  it('returns 0 when no due reminders', async () => {
    reminderFindMany.mockResolvedValue([]);
    const fired = await svc.tick(new Date('2026-04-25T10:00:00Z'));
    expect(fired).toBe(0);
    expect(reminderUpdate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
  });

  it('one-shot reminder: fires once, transitions to COMPLETED, no nextFireAt', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    reminderFindMany.mockResolvedValue([
      {
        id: 'r1',
        userId: 'u1',
        title: 'Doctor appointment',
        rrule: null,
        fireAt: new Date('2026-04-25T09:00:00Z'),
        nextFireAt: new Date('2026-04-25T09:00:00Z'),
      },
    ]);

    const fired = await svc.tick(now);

    expect(fired).toBe(1);
    const update = reminderUpdate.mock.calls[0][0];
    expect(update.where).toEqual({ id: 'r1' });
    expect(update.data.lastFiredAt).toBe(now);
    expect(update.data.nextFireAt).toBeNull();
    expect(update.data.status).toBe('COMPLETED');

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

    const update = reminderUpdate.mock.calls[0][0].data;
    expect(update.status).toBe('ACTIVE');
    expect(update.nextFireAt).toBeInstanceOf(Date);
    expect((update.nextFireAt as Date).getTime()).toBeGreaterThan(dueAt.getTime());

    const notif = notificationCreate.mock.calls[0][0].data;
    // Tekrarlayan body sıradaki occurrence'ı içerir
    expect(notif.body).toContain('Tekrarlayan');
    expect(notif.body).toContain('Sıradaki');
  });

  it('one tx failure does not block other reminders in the batch', async () => {
    const now = new Date('2026-04-25T10:00:00Z');
    reminderFindMany.mockResolvedValue([
      { id: 'rOk', userId: 'u1', title: 'OK', rrule: null, fireAt: now, nextFireAt: now },
      { id: 'rBad', userId: 'u1', title: 'Bad', rrule: null, fireAt: now, nextFireAt: now },
    ]);

    // Make $transaction fail for the second call
    let callCount = 0;
    (svc as any).prisma.$transaction = jest.fn(async (cb: any) => {
      callCount++;
      if (callCount === 2) throw new Error('boom');
      return cb({
        reminder: { update: reminderUpdate },
        notification: { create: notificationCreate },
      });
    });

    const fired = await svc.tick(now);

    // First fired ok, second threw → batch result is 1
    expect(fired).toBe(1);
  });
});
