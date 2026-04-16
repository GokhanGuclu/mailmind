import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { GoogleOAuthService } from './application/google-oauth.service';
import { GoogleAccountService } from './application/google-account.service';
import { GoogleOAuthController } from './presentation/google-oauth.controller';

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [GoogleOAuthController],
  providers: [GoogleOAuthService, GoogleAccountService],
  exports: [GoogleOAuthService, GoogleAccountService],
})
export class IntegrationsModule {}
