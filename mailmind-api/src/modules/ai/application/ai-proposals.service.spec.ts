import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiProposalsService, type ProposalKind } from './ai-proposals.service';

type MockTable = {
  findMany: jest.Mock;
  count: jest.Mock;
  updateMany: jest.Mock;
  findUniqueOrThrow: jest.Mock;
};

function makeTable(): MockTable {
  return {
    findMany: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
}

describe('AiProposalsService', () => {
  let task: MockTable;
  let calendarEvent: MockTable;
  let reminder: MockTable;
  let svc: AiProposalsService;

  beforeEach(() => {
    task = makeTable();
    calendarEvent = makeTable();
    reminder = makeTable();
    const prisma = { task, calendarEvent, reminder } as any;
    svc = new AiProposalsService(prisma);
  });

  describe('list()', () => {
    it('returns all three PROPOSED arrays for the user', async () => {
      task.findMany.mockResolvedValue([{ id: 't1' }]);
      calendarEvent.findMany.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      reminder.findMany.mockResolvedValue([]);

      const out = await svc.list('u1');

      expect(out).toEqual({
        tasks: [{ id: 't1' }],
        calendarEvents: [{ id: 'e1' }, { id: 'e2' }],
        reminders: [],
      });
      for (const t of [task, calendarEvent, reminder]) {
        expect(t.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: 'u1', status: 'PROPOSED' },
          }),
        );
      }
    });
  });

  describe('count()', () => {
    it('sums all three categories into total', async () => {
      task.count.mockResolvedValue(2);
      calendarEvent.count.mockResolvedValue(1);
      reminder.count.mockResolvedValue(3);

      const out = await svc.count('u1');

      expect(out).toEqual({ tasks: 2, calendarEvents: 1, reminders: 3, total: 6 });
    });
  });

  describe('byMessage()', () => {
    it('groups PROPOSED items per mailboxMessage id and sums per kind', async () => {
      // m1: 1 task + 1 reminder; m2: 2 calendar events; m3: 1 task only
      task.findMany.mockResolvedValue([
        { aiAnalysis: { mailboxMessageId: 'm1' } },
        { aiAnalysis: { mailboxMessageId: 'm3' } },
      ]);
      calendarEvent.findMany.mockResolvedValue([
        { aiAnalysis: { mailboxMessageId: 'm2' } },
        { aiAnalysis: { mailboxMessageId: 'm2' } },
      ]);
      reminder.findMany.mockResolvedValue([
        { aiAnalysis: { mailboxMessageId: 'm1' } },
      ]);

      const out = await svc.byMessage('u1');

      expect(out).toEqual({
        m1: { tasks: 1, calendarEvents: 0, reminders: 1, total: 2 },
        m2: { tasks: 0, calendarEvents: 2, reminders: 0, total: 2 },
        m3: { tasks: 1, calendarEvents: 0, reminders: 0, total: 1 },
      });
      // PROPOSED + aiAnalysisId not null filter on every query
      for (const tbl of [task, calendarEvent, reminder]) {
        const where = tbl.findMany.mock.calls[0][0].where;
        expect(where.userId).toBe('u1');
        expect(where.status).toBe('PROPOSED');
        expect(where.aiAnalysisId).toEqual({ not: null });
      }
    });

    it('returns empty object when no PROPOSED rows', async () => {
      task.findMany.mockResolvedValue([]);
      calendarEvent.findMany.mockResolvedValue([]);
      reminder.findMany.mockResolvedValue([]);

      const out = await svc.byMessage('u1');
      expect(out).toEqual({});
    });

    it('skips rows with null aiAnalysis (defensive)', async () => {
      task.findMany.mockResolvedValue([
        { aiAnalysis: null },
        { aiAnalysis: { mailboxMessageId: 'm1' } },
      ]);
      calendarEvent.findMany.mockResolvedValue([]);
      reminder.findMany.mockResolvedValue([]);

      const out = await svc.byMessage('u1');
      expect(out).toEqual({
        m1: { tasks: 1, calendarEvents: 0, reminders: 0, total: 1 },
      });
    });
  });

  describe('approve()', () => {
    it('transitions task PROPOSED → PENDING', async () => {
      task.updateMany.mockResolvedValue({ count: 1 });
      task.findUniqueOrThrow.mockResolvedValue({ id: 't1', status: 'PENDING' });

      const out = await svc.approve('u1', 'task', 't1');

      expect(task.updateMany).toHaveBeenCalledWith({
        where: { id: 't1', userId: 'u1', status: 'PROPOSED' },
        data: { status: 'PENDING' },
      });
      expect(out.status).toBe('PENDING');
    });

    it('transitions calendar-event PROPOSED → PENDING', async () => {
      calendarEvent.updateMany.mockResolvedValue({ count: 1 });
      calendarEvent.findUniqueOrThrow.mockResolvedValue({ id: 'e1', status: 'PENDING' });

      const out = await svc.approve('u1', 'calendar-event', 'e1');

      expect(calendarEvent.updateMany).toHaveBeenCalledWith({
        where: { id: 'e1', userId: 'u1', status: 'PROPOSED' },
        data: { status: 'PENDING' },
      });
      expect(out.status).toBe('PENDING');
    });

    it('transitions reminder PROPOSED → ACTIVE (so scheduler picks it up)', async () => {
      reminder.updateMany.mockResolvedValue({ count: 1 });
      reminder.findUniqueOrThrow.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });

      const out = await svc.approve('u1', 'reminder', 'r1');

      expect(reminder.updateMany).toHaveBeenCalledWith({
        where: { id: 'r1', userId: 'u1', status: 'PROPOSED' },
        data: { status: 'ACTIVE' },
      });
      expect(out.status).toBe('ACTIVE');
    });

    it('rejects unknown kind with BadRequestException', async () => {
      await expect(
        svc.approve('u1', 'reminderr' as ProposalKind, 'x'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when item not in PROPOSED state (atomic guard)', async () => {
      task.updateMany.mockResolvedValue({ count: 0 });

      await expect(svc.approve('u1', 'task', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(task.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('NotFoundException also fires when wrong userId (cross-tenant attempt)', async () => {
      task.updateMany.mockResolvedValue({ count: 0 });

      await expect(svc.approve('uOther', 'task', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('reject()', () => {
    it('transitions task PROPOSED → CANCELLED', async () => {
      task.updateMany.mockResolvedValue({ count: 1 });
      task.findUniqueOrThrow.mockResolvedValue({ id: 't1', status: 'CANCELLED' });

      const out = await svc.reject('u1', 'task', 't1');

      expect(task.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
      expect(out.status).toBe('CANCELLED');
    });

    it('reminder reject → CANCELLED (not PAUSED, scheduler ignores)', async () => {
      reminder.updateMany.mockResolvedValue({ count: 1 });
      reminder.findUniqueOrThrow.mockResolvedValue({ id: 'r1', status: 'CANCELLED' });

      const out = await svc.reject('u1', 'reminder', 'r1');

      expect(reminder.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
      expect(out.status).toBe('CANCELLED');
    });

    it('NotFoundException for non-PROPOSED reject (idempotent re-reject)', async () => {
      task.updateMany.mockResolvedValue({ count: 0 });

      await expect(svc.reject('u1', 'task', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
