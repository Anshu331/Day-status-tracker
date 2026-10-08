import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Container } from './container.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { createErrorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createEntriesRouter } from './modules/entries/entries.routes.js';

export function createApp(container: Container): Express {
  const { config, logger, db, authService, entriesService } = container;
  const authenticate = createAuthenticate(authService, config.auth.cookieName);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, error) => {
        if (error || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());

  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', createAuthRouter({ authService, config, authenticate }));
  app.use('/api/entries', createEntriesRouter({ entriesService, authenticate }));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
