import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { AppConfig } from '../../config/env.js';
import { TooManyRequestsError } from '../../lib/errors.js';
import { createAuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

interface AuthRouterDependencies {
  authService: AuthService;
  config: AppConfig;
  authenticate: RequestHandler;
}

export function createAuthRouter({ authService, config, authenticate }: AuthRouterDependencies) {
  const router = Router();
  const controller = createAuthController(authService, {
    name: config.auth.cookieName,
    secure: config.auth.cookieSecure,
    maxAgeSeconds: config.auth.tokenTtlSeconds,
  });

  const loginLimiter = rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    limit: config.auth.loginRateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError('Too many failed login attempts. Please try again later.'));
    },
  });

  router.post('/login', loginLimiter, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
}
