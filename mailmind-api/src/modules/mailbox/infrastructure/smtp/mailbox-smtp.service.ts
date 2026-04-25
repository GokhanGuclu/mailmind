import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { CredentialCipher } from '../../../../shared/infrastructure/security/credential-cipher';
import { SendMessageDto } from '../../application/dto/send-message.dto';

@Injectable()
export class MailboxSmtpService {
  private readonly logger = new Logger(MailboxSmtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: CredentialCipher,
  ) {}

  async send(userId: string, accountId: string, dto: SendMessageDto): Promise<{ messageId: string }> {
    // Sahiplik kontrolü
    const account = await this.prisma.mailboxAccount.findUnique({
      where: { id: accountId },
      select: { userId: true, email: true, displayName: true },
    });
    if (!account) throw new NotFoundException('Mailbox account not found.');
    if (account.userId !== userId) throw new ForbiddenException();

    // SMTP credential yükle
    const cred = await this.prisma.mailboxCredential.findUnique({
      where: { mailboxAccountId: accountId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUsername: true,
        smtpPasswordEnc: true,
      },
    });

    if (!cred?.smtpHost || !cred.smtpUsername || !cred.smtpPasswordEnc) {
      throw new BadRequestException(
        'SMTP credentials not configured for this account. Please re-activate with SMTP settings.',
      );
    }

    const smtpPassword = this.cipher.decrypt(cred.smtpPasswordEnc);

    const transporter = nodemailer.createTransport({
      host: cred.smtpHost,
      port: cred.smtpPort ?? 587,
      secure: (cred.smtpPort ?? 587) === 465,
      auth: {
        user: cred.smtpUsername,
        pass: smtpPassword,
      },
    });

    const fromAddress = account.displayName
      ? `${account.displayName} <${account.email}>`
      : account.email;

    const attachments = dto.attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.contentBase64, 'base64'),
      contentType: a.contentType,
    }));

    const info = await transporter.sendMail({
      from: fromAddress,
      to: dto.to.join(', '),
      cc: dto.cc?.join(', '),
      bcc: dto.bcc?.join(', '),
      subject: dto.subject ?? '(no subject)',
      text: dto.text,
      html: dto.html,
      inReplyTo: dto.inReplyTo,
      attachments,
    });

    this.logger.log(`Mail sent: messageId=${info.messageId} from=${account.email} to=${dto.to.join(',')}`);

    return { messageId: info.messageId };
  }
}
