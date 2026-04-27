import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let create: jest.Mock;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  let count: jest.Mock;
  let update: jest.Mock;
  let updateMany: jest.Mock;
  let svc: NotificationsService;

  beforeEach(() => {
    create = jest.fn();
    findMany = jest.fn();
    findFirst = jest.fn();
    count = jest.fn();
    update = jest.fn();
    updateMany = jest.fn();
    const prisma = {
      notification: { create, findMany, findFirst, count, update, updateMany },
    } as any;
    svc = new NotificationsService(prisma);
  });

  describe('create()', () => {
    it('writes the canonical fields and slices long titles', async () => {
      create.mockResolvedValue({ id: 'n1' });

      const longTitle = 'x'.repeat(600);
      await svc.create({
        userId: 'u1',
        type: 'REMINDER_FIRED',
        title: longTitle,
        body: 'hi',
        sourceType: 'reminder',
        sourceId: 'r1',
      });

      const arg = create.mock.calls[0][0];
      expect(arg.data.userId).toBe('u1');
      expect(arg.data.type).toBe('REMINDER_FIRED');
      expect(arg.data.title.length).toBe(500);
      expect(arg.data.body).toBe('hi');
      expect(arg.data.sourceType).toBe('reminder');
      expect(arg.data.sourceId).toBe('r1');
    });

    it('coalesces missing optional fields to null', async () => {
      create.mockResolvedValue({ id: 'n2' });
      await svc.create({ userId: 'u1', type: 'SYSTEM', title: 't' });

      const arg = create.mock.calls[0][0];
      expect(arg.data.body).toBeNull();
      expect(arg.data.sourceType).toBeNull();
      expect(arg.data.sourceId).toBeNull();
    });
  });

  describe('list()', () => {
    it('returns by isRead asc then createdAt desc, default limit 50', async () => {
      findMany.mockResolvedValue([]);
      await svc.list('u1');

      const arg = findMany.mock.calls[0][0];
      expect(arg.where).toEqual({ userId: 'u1' });
      expect(arg.orderBy).toEqual([{ isRead: 'asc' }, { createdAt: 'desc' }]);
      expect(arg.take).toBe(50);
    });

    it('applies unreadOnly filter', async () => {
      findMany.mockResolvedValue([]);
      await svc.list('u1', { unreadOnly: true });

      expect(findMany.mock.calls[0][0].where).toEqual({ userId: 'u1', isRead: false });
    });

    it('caps limit at 200', async () => {
      findMany.mockResolvedValue([]);
      await svc.list('u1', { limit: 9999 });

      expect(findMany.mock.calls[0][0].take).toBe(200);
    });
  });

  describe('unreadCount()', () => {
    it('counts only isRead=false rows for the user', async () => {
      count.mockResolvedValue(7);
      const n = await svc.unreadCount('u1');
      expect(n).toBe(7);
      expect(count).toHaveBeenCalledWith({ where: { userId: 'u1', isRead: false } });
    });
  });

  describe('markRead()', () => {
    it('updates isRead and sets readAt when found', async () => {
      findFirst.mockResolvedValue({ id: 'n1' });
      update.mockResolvedValue({ id: 'n1', isRead: true });

      await svc.markRead('u1', 'n1');

      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'u1' },
        select: { id: true },
      });
      const arg = update.mock.calls[0][0];
      expect(arg.where).toEqual({ id: 'n1' });
      expect(arg.data.isRead).toBe(true);
      expect(arg.data.readAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when notification missing or wrong user', async () => {
      findFirst.mockResolvedValue(null);
      await expect(svc.markRead('u1', 'nx')).rejects.toBeInstanceOf(NotFoundException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('markAllRead()', () => {
    it('returns updated count', async () => {
      updateMany.mockResolvedValue({ count: 3 });
      const out = await svc.markAllRead('u1');

      expect(out).toEqual({ count: 3 });
      expect(updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isRead: false },
        data: expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      });
    });
  });
});
