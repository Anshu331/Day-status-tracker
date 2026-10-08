import type { Request, RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import type { User } from '../modules/auth/user.repository.js';

export function createAuthenticate(authService: AuthService, cookieName: string): RequestHandler {
  return async (req, _res, next) => {
    const token: unknown = req.cookies?.[cookieName];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await authService.authenticate(token);
    if (!user) {
      throw new UnauthorizedError('Your session is invalid or has expired');
    }

    req.user = user;
    next();
  };
}

export function requireUser(req: Request): User {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}
