import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsEmail({}, { each: true })
  to: string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  inReplyTo?: string; // reply için: orijinal mesajın providerMessageId'si
}
