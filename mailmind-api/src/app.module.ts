import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { IamModule } from './modules/iam/iam.module';
import { MailboxModule } from './modules/mailbox/mailbox.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AiModule } from './modules/ai/ai.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { DraftsModule } from './modules/drafts/drafts.module';

@Module({
  imports: [
    PrismaModule,
    IamModule,
    MailboxModule,
    TasksModule,
    CalendarModule,
    AiModule,
    IntegrationsModule,
    DraftsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}