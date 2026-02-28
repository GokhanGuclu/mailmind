import { Controller, Get } from '@nestjs/common';

@Controller('mailbox')
export class MailboxController {
  @Get('health')
  health() {
    return { ok: true, module: 'mailbox' };
  }
}