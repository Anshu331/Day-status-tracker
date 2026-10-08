import type { CookieOptions, Request, Response } from 'express';
import { requireUser } from '../../middleware/authenticate.js';
import { loginBodySchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

export interface SessionCookieSettings {
  name: string;
  secure: boolean;
  maxAgeSeconds: number;
}

export function createAuthController(authService: AuthService, cookie: SessionCookieSettings) {
  const baseCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: 'lax',
    path: '/',
  };

  return {
    async login(req: Request, res: Response): Promise<void> {
      const { username, password } = loginBodySchema.parse(req.body);
      const { user, token } = await authService.login(username, password);

      res
        .cookie(cookie.name, token, { ...baseCookieOptions, maxAge: cookie.maxAgeSeconds * 1000 })
        .status(200)
        .json({ data: user });
    },

    logout(_req: Request, res: Response): void {
      res.clearCookie(cookie.name, baseCookieOptions).status(204).end();
    },

    me(req: Request, res: Response): void {
      res.json({ data: requireUser(req) });
    },
  };
}
