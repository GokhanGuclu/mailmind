import { Module } from '@nestjs/common';
import { CalendarController } from './presentation/calendar.controller';
import { CalendarService } from './application/calendar.service';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
