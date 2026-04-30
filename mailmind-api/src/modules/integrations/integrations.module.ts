import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { GoogleOAuthService } from './application/google-oauth.service';
import { GoogleAccountService } from './application/google-account.service';
import { GoogleCalendarService } from './application/google-calendar.service';
import { GoogleCalendarPushWorkerService } from './application/google-calendar-push.worker';
import { GoogleOAuthController } from './presentation/google-oauth.controller';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [GoogleOAuthController],
  providers: [
    GoogleOAuthService,
    GoogleAccountService,
    GoogleCalendarService,
    GoogleCalendarPushWorkerService,
  ],
  exports: [GoogleOAuthService, GoogleAccountService, GoogleCalendarService],
})
export class IntegrationsModule {}
