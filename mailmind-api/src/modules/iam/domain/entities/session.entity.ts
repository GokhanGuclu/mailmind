export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly refreshTokenHash: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
  ) {}

  isExpired(now = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}