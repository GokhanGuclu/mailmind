import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

type EncPayload = { version: 'v1'; iv: Buffer; ciphertext: Buffer; tag: Buffer };

@Injectable()
export class CredentialCipher {
  private readonly keyV1: Buffer;

  constructor() {
    const b64 = process.env.MAILBOX_CRED_KEY_V1;
    if (!b64) throw new Error('MAILBOX_CRED_KEY_V1 is not set');

    const key = Buffer.from(b64, 'base64');
    if (key.length !== 32) throw new Error('MAILBOX_CRED_KEY_V1 must be 32 bytes (base64 decoded)');

    this.keyV1 = key;
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // GCM recommended 12 bytes
    const cipher = crypto.createCipheriv('aes-256-gcm', this.keyV1, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      'ENC',
      'v1',
      iv.toString('base64'),
      ciphertext.toString('base64'),
      tag.toString('base64'),
    ].join(':');
    // ENC:v1:iv:ciphertext:tag
  }

  decrypt(raw: string): string {
    // Backward-compat (migration dönemi için):
    if (raw.startsWith('PLAINTEXT:')) return raw.slice('PLAINTEXT:'.length);

    const parts = raw.split(':');
    if (parts.length !== 5 || parts[0] !== 'ENC') throw new Error('Invalid encrypted credential format');

    const version = parts[1];
    if (version !== 'v1') throw new Error(`Unsupported credential version: ${version}`);

    const iv = Buffer.from(parts[2], 'base64');
    const ciphertext = Buffer.from(parts[3], 'base64');
    const tag = Buffer.from(parts[4], 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.keyV1, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    return plaintext;
  }
}