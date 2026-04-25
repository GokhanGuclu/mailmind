import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DraftAttachmentDto {
  @IsString()
  filename: string;

  /** Base64-encoded dosya içeriği ("data:" öneki çıkarılmış). */
  @IsString()
  contentBase64: string;

  @IsOptional()
  @IsString()
  contentType?: string;
}

export class SaveDraftDto {
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  to?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftAttachmentDto)
  attachments?: DraftAttachmentDto[];
}
