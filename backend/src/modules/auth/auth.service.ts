import { UnauthorizedError } from '../../lib/errors.js';
import type { PasswordHasher } from '../../lib/password.js';
import type { TokenService } from '../../lib/token.js';
import type { User, UserRepository } from './user.repository.js';

export interface LoginResult {
  user: User;
  token: string;
}

export class AuthService {
  // compared against for unknown usernames so response time doesn't reveal which users exist
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const credentials = await this.users.findCredentialsByUsername(username);
    const hashToCompare = credentials?.passwordHash ?? (await this.getDummyHash());
    const isValid = await this.passwords.verify(password, hashToCompare);

    if (!credentials || !isValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const { passwordHash: _passwordHash, ...user } = credentials;
    return { user, token: this.tokens.sign({ userId: user.id, username: user.username }) };
  }

  async authenticate(token: string): Promise<User | null> {
    const claims = this.tokens.verify(token);
    return claims ? this.users.findById(claims.userId) : null;
  }

  async register(username: string, password: string): Promise<User> {
    return this.users.create(username, await this.passwords.hash(password));
  }

  async ensureSeedUser(seed: { username: string; password: string } | null): Promise<User | null> {
    if (!seed || (await this.users.count()) > 0) return null;
    return this.register(seed.username, seed.password);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwords.hash('timing-attack-mitigation');
    return this.dummyHash;
  }
}
