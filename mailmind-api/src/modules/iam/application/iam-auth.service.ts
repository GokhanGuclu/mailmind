import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { addDays } from './time';
import { IamUserRepositoryPrisma } from '../infrastructure/persistence/iam-user.repository.prisma';
import { IamSessionRepositoryPrisma } from '../infrastructure/persistence/iam-session.repository.prisma';
import { PasswordHasherArgon2 } from '../infrastructure/security/password-hasher.argon2';
import { JwtIssuerService } from '../infrastructure/security/jwt-issuer.service';
import { Email } from '../domain/value-objects/email.vo';
import { EmailAlreadyUsedError, InvalidCredentialsError, SessionInvalidError } from '../domain/errors';
import { Session } from '../domain/entities/session.entity';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

@Injectable()
export class IamAuthService {
  private readonly accessTtlSeconds = 15 * 60; // 15m
  private readonly refreshTtlDays = 14;        // 14d

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: IamUserRepositoryPrisma,
    private readonly sessions: IamSessionRepositoryPrisma,
    private readonly hasher: PasswordHasherArgon2,
    private readonly jwt: JwtIssuerService,
  ) {}

  async register(email: string, password: string, meta?: { userAgent?: string; ip?: string }) {
    try {
      const emailVo = Email.create(email);

      const existing = await this.users.findByEmail(emailVo.value);
      if (existing) throw new EmailAlreadyUsedError();

      // ✅ ACID: user + session + token hash tek tx
      return await this.prisma.$transaction(async (tx) => {
        const passwordHash = await this.hasher.hash(password);

        const user = await this.users.createTx(tx, {
          email: emailVo.value,
          passwordHash,
        });

        return this.issueTokensTx(tx, user.id, meta);
      });
    } catch (e) {
      this.mapDomainError(e);
    }
  }

  async login(email: string, password: string, meta?: { userAgent?: string; ip?: string }) {
    try {
      const emailVo = Email.create(email);

      const user = await this.users.findByEmail(emailVo.value);
      if (!user) throw new InvalidCredentialsError();

      const ok = await this.hasher.verify(user.passwordHash, password);
      if (!ok) throw new InvalidCredentialsError();

      // ✅ ACID: session + token hash tek tx
      return await this.prisma.$transaction(async (tx) => {
        return this.issueTokensTx(tx, user.id, meta);
      });
    } catch (e) {
      this.mapDomainError(e);
    }
  }

  async refresh(refreshToken: string, meta?: { userAgent?: string; ip?: string }) {
    try {
      const payload = this.jwt.verifyRefresh(refreshToken);
      const sessionId = payload.sid as string | undefined;
      const userId = payload.sub as string;

      if (!sessionId) throw new SessionInvalidError('Missing session id (sid)');

      const sessionRow = await this.sessions.findById(sessionId);
      if (!sessionRow) throw new SessionInvalidError('Session not found');
      if (sessionRow.userId !== userId) throw new SessionInvalidError('Session user mismatch');

      const session = new Session(
        sessionRow.id,
        sessionRow.userId,
        sessionRow.refreshTokenHash,
        sessionRow.expiresAt,
        sessionRow.revokedAt ?? null,
      );

      if (session.isRevoked()) throw new SessionInvalidError('Session revoked');
      if (session.isExpired()) throw new SessionInvalidError('Session expired');

      const ok = await this.hasher.verify(session.refreshTokenHash, refreshToken);
      if (!ok) {
        await this.sessions.revoke(session.id);
        throw new SessionInvalidError('Invalid refresh token');
      }

      const expiresAt = addDays(new Date(), this.refreshTtlDays);

      const rotated = await this.sessions.rotateWithIssuedToken({
        oldSessionId: session.id,
        userId,
        expiresAt,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
        issueToken: async (newSessionId) => {
          const newRefreshToken = this.jwt.signRefresh(
            { sub: userId, sid: newSessionId },
            { ttlDays: this.refreshTtlDays },
          );

          const newHash = await this.hasher.hash(newRefreshToken);

          return {
            refreshToken: newRefreshToken,
            refreshTokenHash: newHash,
          };
        },
      });

      const accessToken = this.jwt.signAccess(
        { sub: userId },
        { ttlSeconds: this.accessTtlSeconds },
      );

      return {
        accessToken,
        refreshToken: rotated.refreshToken,
        expiresInSeconds: this.accessTtlSeconds,
      };
    } catch (e) {
      this.mapDomainError(e);
    }
  }

  async me(userId: string) {
    if (!userId) throw new UnauthorizedException('Invalid access token payload');
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.verifyRefresh(refreshToken);
      const sessionId = payload.sid as string | undefined;
      if (!sessionId) throw new SessionInvalidError('Missing session id (sid)');
      await this.sessions.revoke(sessionId);
    } catch (e) {
      this.mapDomainError(e);
    }
  }

  private async issueTokensTx(
    tx: Prisma.TransactionClient,
    userId: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    // 1) session create (TEMP)
    const expiresAt = addDays(new Date(), this.refreshTtlDays);

    const session = await this.sessions.createTx(tx, {
      userId,
      refreshTokenHash: 'TEMP',
      expiresAt,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
    });

    // 2) sid içeren refresh token üret
    const refreshToken = this.jwt.signRefresh(
      { sub: userId, sid: session.id },
      { ttlDays: this.refreshTtlDays },
    );

    // 3) hash’i tx içinde yaz
    const refreshTokenHash = await this.hasher.hash(refreshToken);
    await this.sessions.updateHashTx(tx, session.id, refreshTokenHash);

    // 4) access token üret (DB write değil ama aynı request’in parçası)
    const accessToken = this.jwt.signAccess(
      { sub: userId },
      { ttlSeconds: this.accessTtlSeconds },
    );

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: this.accessTtlSeconds,
    };
  }
  private mapDomainError(e: unknown): never {
    if (e instanceof EmailAlreadyUsedError) throw new ConflictException(e.message);
    if (e instanceof InvalidCredentialsError) throw new UnauthorizedException(e.message);
    if (e instanceof SessionInvalidError) throw new UnauthorizedException(e.message);

    // Email VO’dan gelen basic hatalar
    if (e instanceof Error && (e.message === 'Invalid email' || e.message === 'Email cannot be empty')) {
      throw new BadRequestException(e.message);
    }

    // diğerleri: yukarı fırlat
    throw e as any;
  }
}

