import { Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { GoogleOAuthService } from '../application/google-oauth.service';
import { GoogleAccountService } from '../application/google-account.service';

@Controller('integrations/google')
export class GoogleOAuthController {
  constructor(
    private readonly oauth: GoogleOAuthService,
    private readonly googleAccount: GoogleAccountService,
  ) {}

  /**
   * Authenticated endpoint. Frontend calls this to obtain the Google authorize URL,
   * which encodes the userId in a signed `state` parameter.
   */
  @Post('start')
  @UseGuards(JwtAccessGuard)
  start(@Req() req: Request) {
    const userId = (req as any).user?.id as string;
    const authorizeUrl = this.oauth.buildAuthorizeUrl(userId);
    return { authorizeUrl };
  }

  /**
   * Google redirects the browser here after consent. No auth header — userId is
   * recovered from the signed `state` parameter.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') errorParam: string | undefined,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    if (errorParam) {
      return res.redirect(`${frontendUrl}/connect-email?gmail=error&reason=${encodeURIComponent(errorParam)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/connect-email?gmail=error&reason=missing_code_or_state`);
    }

    let userId: string;
    try {
      userId = this.oauth.verifyState(state);
    } catch {
      return res.redirect(`${frontendUrl}/connect-email?gmail=error&reason=invalid_state`);
    }

    try {
      const { email } = await this.googleAccount.handleCallback(userId, code);
      return res.redirect(`${frontendUrl}/connect-email?gmail=connected&email=${encodeURIComponent(email)}`);
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'unknown';
      return res.redirect(`${frontendUrl}/connect-email?gmail=error&reason=${encodeURIComponent(reason)}`);
    }
  }
}
