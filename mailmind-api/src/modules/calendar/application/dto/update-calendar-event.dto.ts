import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

enum CalendarEventStatusDto {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString({ each: true })
  attendees?: string[];

  @IsOptional()
  @IsEnum(CalendarEventStatusDto)
  status?: CalendarEventStatusDto;
}
