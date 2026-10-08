import { compare, hash } from 'bcryptjs';

export class PasswordHasher {
  constructor(private readonly rounds: number) {}

  hash(plainText: string): Promise<string> {
    return hash(plainText, this.rounds);
  }

  verify(plainText: string, passwordHash: string): Promise<boolean> {
    return compare(plainText, passwordHash);
  }
}
