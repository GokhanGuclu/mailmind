import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageAttachmentDto {
  @IsString()
  filename: string;

  /** Base64-encoded file contents (bare; "data:" prefix removed) */
  @IsString()
  contentBase64: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendMessageAttachmentDto)
  attachments?: SendMessageAttachmentDto[];
}
