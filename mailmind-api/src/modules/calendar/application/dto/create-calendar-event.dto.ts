import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString({ each: true })
  attendees?: string[]; // ["a@x.com", "b@x.com"]
}
