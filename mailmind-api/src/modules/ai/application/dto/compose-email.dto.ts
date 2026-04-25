import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ComposeEmailDto {
  /** Kullanıcının ne yazmak istediğini tarif eden serbest metin. */
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  prompt: string;

  @IsOptional()
  @IsIn(['tr', 'en'])
  language?: 'tr' | 'en';

  @IsOptional()
  @IsIn(['formal', 'friendly', 'neutral'])
  tone?: 'formal' | 'friendly' | 'neutral';

  @IsOptional()
  @IsIn(['short', 'normal', 'long'])
  length?: 'short' | 'normal' | 'long';
}
