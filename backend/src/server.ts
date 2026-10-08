import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createContainer } from './container.js';
import { runMigrations } from './db/migrate.js';
import { createPostgresDatabase } from './db/postgres.js';
import { createLogger } from './lib/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const config = loadConfig();
const logger = createLogger(config);
const db = createPostgresDatabase({
  connectionString: config.database.url,
  maxConnections: config.database.poolMax,
  logger,
});

try {
  await runMigrations(db, logger);

  const container = createContainer(config, logger, db);
  const seededUser = await container.authService.ensureSeedUser(config.seedUser);
  if (seededUser) {
    logger.warn(
      { username: seededUser.username },
      'Created bootstrap user from SEED_ADMIN_* settings. Change these credentials outside local development.',
    );
  }

  const server = createApp(container).listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, 'Shutting down');
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

    server.close((error) => {
      db.close().finally(() => process.exit(error ? 1 : 0));
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  logger.fatal({ err: error }, 'Failed to start the API (is DATABASE_URL correct and reachable?)');
  await db.close().catch(() => undefined);
  process.exit(1);
}
