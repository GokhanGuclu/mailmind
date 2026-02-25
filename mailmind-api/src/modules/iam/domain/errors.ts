export class EmailAlreadyUsedError extends Error {
  constructor() {
    super('Email already in use');
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
  }
}

export class SessionInvalidError extends Error {
  constructor(message = 'Invalid session') {
    super(message);
  }
}