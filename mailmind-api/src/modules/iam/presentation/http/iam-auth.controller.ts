import { Body, Controller, Post, Req, Get, UseGuards } from '@nestjs/common';
import { IamAuthService } from '../../application/iam-auth.service';
import { JwtAccessGuard } from './jwt-access.guard';

type ReqLike = { headers: Record<string, string | undefined>; ip?: string; user?: any };

@Controller('auth')
export class IamAuthController {
  constructor(private readonly auth: IamAuthService) {}

  @Post('register')
  register(@Body() body: { email: string; password: string }, @Req() req: ReqLike) {
    return this.auth.register(body.email, body.password, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }, @Req() req: ReqLike) {
    return this.auth.login(body.email, body.password, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }, @Req() req: ReqLike) {
    return this.auth.refresh(body.refreshToken, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    await this.auth.logout(body.refreshToken);
    return { ok: true };
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@Req() req: ReqLike) {
    return this.auth.me(req.user.sub);
  }
}