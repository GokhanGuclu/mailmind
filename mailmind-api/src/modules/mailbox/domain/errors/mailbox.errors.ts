export class MailboxAccountNotFoundError extends Error {
  constructor() {
    super('Mailbox account not found');
  }
}

export class MailboxAccountForbiddenError extends Error {
  constructor() {
    super('Mailbox account forbidden');
  }
}

export class MailboxAccountInvalidActivatePayloadError extends Error {
  constructor() {
    super('Provide OAuth tokens or IMAP credentials.');
  }
}