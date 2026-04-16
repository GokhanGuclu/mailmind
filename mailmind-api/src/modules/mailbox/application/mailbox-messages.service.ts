import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ListMessagesDto } from './dto/list-messages.dto';

@Injectable()
export class MailboxMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bir mailbox hesabına ait mesajları listeler.
   * Cursor-based pagination: cursor = son sayfanın en eski/en yeni mesajının date+id çifti.
   * Basit implementasyon: cursor = son mesajın `id`'si, skip+take yerine id-based keyset.
   */
  async list(userId: string, accountId: string, dto: ListMessagesDto) {
    await this.assertOwnership(userId, accountId);

    const limit = dto.limit ?? 50;
    const order = dto.order ?? 'desc';

    const where: any = { mailboxAccountId: accountId };
    if (dto.folder) where.folder = dto.folder;

    // Cursor-based pagination: cursor = mesajın `id`si
    // desc sıralamada: cursor'dan KÜÇÜK id'leri getir (daha eski)
    // asc sıralamada: cursor'dan BÜYÜK id'leri getir (daha yeni)
    if (dto.cursor) {
      const cursorMsg = await this.prisma.mailboxMessage.findUnique({
        where: { id: dto.cursor },
        select: { date: true },
      });
      if (cursorMsg) {
        if (order === 'desc') {
          where.date = { lt: cursorMsg.date };
        } else {
          where.date = { gt: cursorMsg.date };
        }
      }
    }

    const messages = await this.prisma.mailboxMessage.findMany({
      where,
      orderBy: { date: order },
      take: limit + 1, // bir fazla al → nextCursor var mı kontrol et
      select: {
        id: true,
        providerMessageId: true,
        folder: true,
        from: true,
        to: true,
        subject: true,
        date: true,
        snippet: true,
        isRead: true,
        createdAt: true,
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor, hasMore };
  }

  /**
   * Tekil mesaj detayı (bodyText + bodyHtml dahil).
   * Okundu olarak işaretlemez — kullanıcı açıkça PATCH yapar.
   */
  async getOne(userId: string, accountId: string, messageId: string) {
    await this.assertOwnership(userId, accountId);

    const message = await this.prisma.mailboxMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found.');
    if (message.mailboxAccountId !== accountId) throw new ForbiddenException();

    return message;
  }

  /**
   * Mesajı okundu olarak işaretler.
   */
  async markAsRead(userId: string, accountId: string, messageId: string) {
    await this.assertOwnership(userId, accountId);

    const message = await this.prisma.mailboxMessage.findUnique({
      where: { id: messageId },
      select: { id: true, mailboxAccountId: true, isRead: true },
    });

    if (!message) throw new NotFoundException('Message not found.');
    if (message.mailboxAccountId !== accountId) throw new ForbiddenException();
    if (message.isRead) return { id: message.id, isRead: true }; // idempotent

    await this.prisma.mailboxMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return { id: messageId, isRead: true };
  }

  /**
   * Okunmamış mesaj sayısını döner (badge için kullanışlı).
   */
  async unreadCount(userId: string, accountId: string, folder?: string) {
    await this.assertOwnership(userId, accountId);

    const where: any = { mailboxAccountId: accountId, isRead: false };
    if (folder) where.folder = folder;

    const count = await this.prisma.mailboxMessage.count({ where });
    return { count };
  }

  // ---------------------------------------------------------------------------

  private async assertOwnership(userId: string, accountId: string) {
    const account = await this.prisma.mailboxAccount.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });
    if (!account) throw new NotFoundException('Mailbox account not found.');
    if (account.userId !== userId) throw new ForbiddenException();
  }
}
