import { Module } from '@nestjs/common';
import { RemindersService } from './application/reminders.service';
import { RemindersController } from './presentation/reminders.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule], // RecurrenceDetectorService için
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
