import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  private readonly secret: string;

  constructor() {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    this.secret = process.env.JWT_ACCESS_SECRET;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: any;
      auth?: any;
    }>();

    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');

    const token = auth.slice('Bearer '.length).trim();

    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, this.secret) as string | JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    // ✅ decoded string olamaz (biz object bekliyoruz)
    if (typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid access token payload');
    }

    const userId =
      (decoded.sub as string | undefined) ??
      (decoded as any).id ??
      (decoded as any).userId;

    if (!userId) throw new UnauthorizedException('Invalid access token payload');

    // ✅ Standart: controller'lar req.user.id kullanır
    req.user = { id: userId };

    // İstersen ham payload'ı ayrı yerde sakla (debug/role vs için)
    req.auth = decoded;

    return true;
  }
}