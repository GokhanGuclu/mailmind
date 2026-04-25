import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { SaveDraftDto, DraftAttachmentDto } from './dto/save-draft.dto';

export type DraftView = {
  id: string;
  mailboxAccountId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: DraftAttachmentDto[];
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class DraftsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccountOwnership(userId: string, accountId: string) {
    const acc = await this.prisma.mailboxAccount.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true },
    });
    if (!acc) throw new NotFoundException('Mailbox account not found.');
    if (acc.userId !== userId) throw new ForbiddenException();
  }

  private parseEmails(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  private parseAttachments(raw: Prisma.JsonValue | null | undefined): DraftAttachmentDto[] {
    if (!raw || !Array.isArray(raw)) return [];
    const out: DraftAttachmentDto[] = [];
    for (const a of raw) {
      if (!a || typeof a !== 'object' || Array.isArray(a)) continue;
      const obj = a as Record<string, unknown>;
      if (typeof obj.filename === 'string' && typeof obj.contentBase64 === 'string') {
        out.push({
          filename: obj.filename,
          contentBase64: obj.contentBase64,
          contentType: typeof obj.contentType === 'string' ? obj.contentType : undefined,
        });
      }
    }
    return out;
  }

  private toView(row: {
    id: string;
    mailboxAccountId: string;
    toEmails: string | null;
    ccEmails: string | null;
    bccEmails: string | null;
    subject: string | null;
    bodyText: string | null;
    bodyHtml: string | null;
    attachments: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): DraftView {
    return {
      id: row.id,
      mailboxAccountId: row.mailboxAccountId,
      to: this.parseEmails(row.toEmails),
      cc: this.parseEmails(row.ccEmails),
      bcc: this.parseEmails(row.bccEmails),
      subject: row.subject,
      bodyText: row.bodyText,
      bodyHtml: row.bodyHtml,
      attachments: this.parseAttachments(row.attachments),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(userId: string, accountId: string, dto: SaveDraftDto): Promise<DraftView> {
    await this.assertAccountOwnership(userId, accountId);

    const row = await this.prisma.mailDraft.create({
      data: {
        userId,
        mailboxAccountId: accountId,
        toEmails: dto.to?.length ? JSON.stringify(dto.to) : null,
        ccEmails: dto.cc?.length ? JSON.stringify(dto.cc) : null,
        bccEmails: dto.bcc?.length ? JSON.stringify(dto.bcc) : null,
        subject: dto.subject ?? null,
        bodyText: dto.bodyText ?? null,
        bodyHtml: dto.bodyHtml ?? null,
        attachments: dto.attachments?.length
          ? (dto.attachments as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    return this.toView(row);
  }

  async list(userId: string, accountId: string): Promise<DraftView[]> {
    await this.assertAccountOwnership(userId, accountId);

    const rows = await this.prisma.mailDraft.findMany({
      where: { userId, mailboxAccountId: accountId },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((r) => this.toView(r));
  }

  async getOne(userId: string, accountId: string, draftId: string): Promise<DraftView> {
    await this.assertAccountOwnership(userId, accountId);

    const row = await this.prisma.mailDraft.findUnique({ where: { id: draftId } });
    if (!row) throw new NotFoundException('Draft not found.');
    if (row.userId !== userId || row.mailboxAccountId !== accountId) {
      throw new ForbiddenException();
    }

    return this.toView(row);
  }

  async update(
    userId: string,
    accountId: string,
    draftId: string,
    dto: SaveDraftDto,
  ): Promise<DraftView> {
    await this.assertAccountOwnership(userId, accountId);

    const existing = await this.prisma.mailDraft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true, mailboxAccountId: true },
    });
    if (!existing) throw new NotFoundException('Draft not found.');
    if (existing.userId !== userId || existing.mailboxAccountId !== accountId) {
      throw new ForbiddenException();
    }

    const row = await this.prisma.mailDraft.update({
      where: { id: draftId },
      data: {
        toEmails: dto.to?.length ? JSON.stringify(dto.to) : null,
        ccEmails: dto.cc?.length ? JSON.stringify(dto.cc) : null,
        bccEmails: dto.bcc?.length ? JSON.stringify(dto.bcc) : null,
        subject: dto.subject ?? null,
        bodyText: dto.bodyText ?? null,
        bodyHtml: dto.bodyHtml ?? null,
        attachments: dto.attachments?.length
          ? (dto.attachments as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    return this.toView(row);
  }

  async remove(userId: string, accountId: string, draftId: string): Promise<{ id: string }> {
    await this.assertAccountOwnership(userId, accountId);

    const existing = await this.prisma.mailDraft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true, mailboxAccountId: true },
    });
    if (!existing) throw new NotFoundException('Draft not found.');
    if (existing.userId !== userId || existing.mailboxAccountId !== accountId) {
      throw new ForbiddenException();
    }

    await this.prisma.mailDraft.delete({ where: { id: draftId } });
    return { id: draftId };
  }
}
