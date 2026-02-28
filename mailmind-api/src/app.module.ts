import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { IamModule } from './modules/iam/iam.module';
import { MailboxModule } from './modules/mailbox/mailbox.module';

@Module({
  imports: [PrismaModule, IamModule, MailboxModule],
  controllers: [HealthController],
})
export class AppModule {}