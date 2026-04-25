import { IsIn } from 'class-validator';

export const MESSAGE_FOLDERS = ['INBOX', 'SENT', 'TRASH', 'SPAM'] as const;
export type MessageFolder = (typeof MESSAGE_FOLDERS)[number];

export class MoveMessageDto {
  @IsIn(MESSAGE_FOLDERS as unknown as string[])
  folder: MessageFolder;
}
