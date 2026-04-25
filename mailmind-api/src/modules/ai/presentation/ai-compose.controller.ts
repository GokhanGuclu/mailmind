import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAccessGuard } from '../../iam/presentation/http/jwt-access.guard';
import { AiComposeService } from '../application/ai-compose.service';
import { ComposeEmailDto } from '../application/dto/compose-email.dto';

@UseGuards(JwtAccessGuard)
@Controller('ai/compose')
export class AiComposeController {
  constructor(private readonly svc: AiComposeService) {}

  /** POST /ai/compose — serbest metinden AI ile e-posta taslağı oluştur. */
  @Post()
  compose(@Body() dto: ComposeEmailDto) {
    return this.svc.compose(dto);
  }
}
