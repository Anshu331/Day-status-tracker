import { createServer } from 'node:net';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { SESSION_COOKIE_NAME, type AppConfig } from '../src/config/env.js';
import { createContainer, type Container } from '../src/container.js';
import type { Database } from '../src/db/database.js';
import { runMigrations } from '../src/db/migrate.js';
import { createPostgresDatabase } from '../src/db/postgres.js';
import { createLogger } from '../src/lib/logger.js';

export const TEST_USER = { username: 'tester', password: 'correct-horse-battery' } as const;

const silentLogger = createLogger({ env: 'test', logLevel: 'silent' });

export function createTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    env: 'test',
    port: 0,
    logLevel: 'silent',
    database: { url: 'postgresql://unused', poolMax: 1 },
    auth: {
      jwtSecret: 'test-secret-that-is-definitely-longer-than-32-chars',
      tokenTtlSeconds: 3600,
      bcryptRounds: 4,
      cookieName: SESSION_COOKIE_NAME,
      cookieSecure: false,
      loginRateLimitMax: 100,
    },
    trustProxy: false,
    seedUser: null,
    ...overrides,
  };
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address ? resolve(address.port) : reject(new Error('No port')),
      );
    });
  });
}

export interface TestDatabase {
  db: Database;
  reset(): Promise<void>;
  close(): Promise<void>;
}

// PGlite (Postgres compiled to WASM) exposed over a socket, so tests go through the same
// pg driver, SQL and migrations as production without needing a real database server.
export async function createTestDatabase(): Promise<TestDatabase> {
  const pglite = await PGlite.create();
  const port = await getFreePort();
  const server = new PGLiteSocketServer({ db: pglite, host: '127.0.0.1', port, maxConnections: 4 });
  await server.start();

  const db = createPostgresDatabase({
    connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
    maxConnections: 1,
    logger: silentLogger,
  });
  await runMigrations(db);

  return {
    db,
    reset: async () => {
      await db.query('TRUNCATE day_entries, users RESTART IDENTITY CASCADE');
    },
    close: async () => {
      await db.close();
      await server.stop();
      await pglite.close();
    },
  };
}

export interface TestApp {
  app: Express;
  container: Container;
}

export function createTestApp(db: Database, overrides: Partial<AppConfig> = {}): TestApp {
  const config = createTestConfig(overrides);
  const container = createContainer(config, silentLogger, db);
  return { app: createApp(container), container };
}

export async function createAuthenticatedAgent({ app, container }: TestApp) {
  await container.authService.register(TEST_USER.username, TEST_USER.password);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send(TEST_USER).expect(200);
  return agent;
}
