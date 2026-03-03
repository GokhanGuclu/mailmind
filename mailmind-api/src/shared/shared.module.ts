import { Module } from '@nestjs/common';
import { CredentialCipher } from './infrastructure/security/credential-cipher';

@Module({
  providers: [CredentialCipher],
  exports: [CredentialCipher],
})
export class SharedModule {}