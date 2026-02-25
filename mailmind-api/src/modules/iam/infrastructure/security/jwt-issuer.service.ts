import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

type SignAccessOpts = { ttlSeconds: number };
type SignRefreshOpts = { ttlDays: number };

@Injectable()
export class JwtIssuerService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor() {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    this.accessSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
  }

  signAccess(payload: { sub: string }, opts: SignAccessOpts): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: opts.ttlSeconds });
  }

  signRefresh(payload: { sub: string; sid?: string }, opts: SignRefreshOpts): string {
    const seconds = opts.ttlDays * 24 * 60 * 60;
    return jwt.sign(payload, this.refreshSecret, { expiresIn: seconds });
  }

  verifyRefresh(token: string): any {
    return jwt.verify(token, this.refreshSecret);
  }
}