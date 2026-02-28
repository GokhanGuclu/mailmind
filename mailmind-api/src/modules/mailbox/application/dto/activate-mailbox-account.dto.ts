import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ActivateMailboxAccountDto {
  // OAuth
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsDateString()
  tokenExpiresAt?: string;

  // IMAP
  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  imapPort?: number;

  @IsOptional()
  @IsString()
  imapUsername?: string;

  @IsOptional()
  @IsString()
  imapPassword?: string;
}