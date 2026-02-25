import { Module } from '@nestjs/common';
import { IamAuthController } from './presentation/http/iam-auth.controller';
import { IamAuthService } from './application/iam-auth.service';
import { IamUserRepositoryPrisma } from './infrastructure/persistence/iam-user.repository.prisma';
import { IamSessionRepositoryPrisma } from './infrastructure/persistence/iam-session.repository.prisma';
import { PasswordHasherArgon2 } from './infrastructure/security/password-hasher.argon2';
import { JwtIssuerService } from './infrastructure/security/jwt-issuer.service';
import { JwtAccessGuard } from './presentation/http/jwt-access.guard';

@Module({
  controllers: [IamAuthController],
  providers: [
    IamAuthService,

    // repositories
    IamUserRepositoryPrisma,
    IamSessionRepositoryPrisma,

    // security
    PasswordHasherArgon2,
    JwtIssuerService,
    JwtAccessGuard,
  ],
  exports: [IamAuthService],
})
export class IamModule {}