import jwt from 'jsonwebtoken';

const ISSUER = 'day-status-tracker-api';
const AUDIENCE = 'day-status-tracker-web';
const ALGORITHM = 'HS256';

export interface SessionClaims {
  userId: number;
  username: string;
}

export class TokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number,
  ) {}

  sign(claims: SessionClaims): string {
    return jwt.sign({ username: claims.username }, this.secret, {
      algorithm: ALGORITHM,
      expiresIn: this.ttlSeconds,
      subject: String(claims.userId),
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  }

  verify(token: string): SessionClaims | null {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      if (typeof payload === 'string') return null;

      const userId = Number(payload.sub);
      const username: unknown = payload.username;
      if (!Number.isSafeInteger(userId) || typeof username !== 'string') return null;

      return { userId, username };
    } catch {
      return null;
    }
  }
}
