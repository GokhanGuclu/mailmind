import { MailboxAccountInvalidActivatePayloadError } from '../errors/mailbox.errors';
import { MailboxAccountStatus, MailProvider } from '../value-objects/mail-provider.vo';

export type MailboxAccountProps = {
  id: string;
  userId: string;
  provider: MailProvider;
  email: string;
  displayName: string | null;
  status: MailboxAccountStatus;
};

export type ActivatePayload = {
  // OAuth
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | null;

  // IMAP
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPasswordEnc?: string | null;
};

export class MailboxAccount {
  private props: MailboxAccountProps;

  private constructor(props: MailboxAccountProps) {
    this.props = props;
  }

  static rehydrate(props: MailboxAccountProps) {
    return new MailboxAccount(props);
  }

  get id() {
    return this.props.id;
  }
  get userId() {
    return this.props.userId;
  }
  get provider() {
    return this.props.provider;
  }
  get email() {
    return this.props.email;
  }
  get status() {
    return this.props.status;
  }

  activate(payload: ActivatePayload) {
    const hasOauth = !!payload.accessToken || !!payload.refreshToken;
    const hasImap = !!payload.imapHost || !!payload.imapUsername || !!payload.imapPasswordEnc;

    if (!hasOauth && !hasImap) {
      throw new MailboxAccountInvalidActivatePayloadError();
    }

    this.props.status = MailboxAccountStatus.ACTIVE;

    return {
      outboxType: 'MAILBOX_ACCOUNT_CONNECTED' as const,
      outboxPayload: {
        mailboxAccountId: this.id,
        userId: this.userId,
        provider: this.provider,
        email: this.email,
      },
    };
  }

  revoke() {
    this.props.status = MailboxAccountStatus.REVOKED;

    return {
      outboxType: 'MAILBOX_ACCOUNT_REVOKED' as const,
      outboxPayload: {
        mailboxAccountId: this.id,
        userId: this.userId,
        provider: this.provider,
        email: this.email,
      },
    };
  }
}