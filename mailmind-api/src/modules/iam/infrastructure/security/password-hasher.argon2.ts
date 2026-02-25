import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordHasherArgon2 {
  hash(raw: string): Promise<string> {
    return argon2.hash(raw);
  }

  verify(hash: string, raw: string): Promise<boolean> {
    return argon2.verify(hash, raw);
  }
}