import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Update sırasında kullanıcının dokunabileceği status değerleri:
 * - ACTIVE / PAUSED / CANCELLED
 *
 * COMPLETED'a manuel geçilemez (sadece scheduler completion belirler);
 * PROPOSED'a da geri dönülemez (proposals akışı tek yönlüdür).
 */
export enum UpdatableReminderStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  fireAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rrule?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsEnum(UpdatableReminderStatus)
  status?: UpdatableReminderStatus;
}
