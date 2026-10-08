// Usage: npm run user:create -- --username alice --password "a-strong-password"
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { loadConfig } from '../config/env.js';
import { createContainer } from '../container.js';
import { runMigrations } from '../db/migrate.js';
import { createPostgresDatabase } from '../db/postgres.js';
import { createLogger } from '../lib/logger.js';
import { newPasswordSchema, usernameSchema } from '../modules/auth/auth.schemas.js';

const argsSchema = z.object({ username: usernameSchema, password: newPasswordSchema });

const { values } = parseArgs({
  options: {
    username: { type: 'string', short: 'u' },
    password: { type: 'string', short: 'p' },
  },
});

const parsed = argsSchema.safeParse(values);
if (!parsed.success) {
  console.error('Usage: npm run user:create -- --username <name> --password <password>\n');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.') || 'arguments'}: ${issue.message}`);
  }
  process.exit(1);
}

const config = loadConfig();
const logger = createLogger({ env: config.env, logLevel: 'warn' });
const db = createPostgresDatabase({ connectionString: config.database.url, maxConnections: 1, logger });

try {
  await runMigrations(db);
  const { authService } = createContainer(config, logger, db);
  const user = await authService.register(parsed.data.username, parsed.data.password);
  console.log(`Created user "${user.username}" (id ${user.id}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.close();
}
