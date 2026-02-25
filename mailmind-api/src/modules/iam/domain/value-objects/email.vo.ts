export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const v = (raw ?? '').trim().toLowerCase();

    if (!v) throw new Error('Email cannot be empty');
    // Minimal kontrol: asıl doğrulama zaten DTO/ValidationPipe'da
    if (!v.includes('@')) throw new Error('Invalid email');

    return new Email(v);
  }
}