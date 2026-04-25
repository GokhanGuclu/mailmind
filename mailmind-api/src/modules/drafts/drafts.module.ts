import { Module } from '@nestjs/common';
import { DraftsController } from './presentation/drafts.controller';
import { DraftsService } from './application/drafts.service';

@Module({
  controllers: [DraftsController],
  providers: [DraftsService],
})
export class DraftsModule {}
