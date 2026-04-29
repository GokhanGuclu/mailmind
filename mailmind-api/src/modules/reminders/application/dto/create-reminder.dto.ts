import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /** Tek seferlik anımsatıcı için. fireAt ya da rrule'dan biri verilmeli. */
  @IsOptional()
  @IsDateString()
  fireAt?: string;

  /**
   * RFC 5545 RRULE (örn 'FREQ=DAILY' veya 'FREQ=WEEKLY;BYDAY=MO').
   * Server tarafı RecurrenceDetectorService ile doğrular.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rrule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
