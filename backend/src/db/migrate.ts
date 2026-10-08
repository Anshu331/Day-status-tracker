import type { Logger } from '../lib/logger.js';
import type { Database } from './database.js';
import { migrations as defaultMigrations, type Migration } from './migrations.js';

const MIGRATION_LOCK_KEY = 728_461_903;

// Runs in one transaction (Postgres DDL is transactional) and takes an advisory lock
// so two instances starting at the same time don't both try to migrate.
export async function runMigrations(
  db: Database,
  logger?: Logger,
  migrations: readonly Migration[] = defaultMigrations,
): Promise<void> {
  const applied = await db.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_KEY]);
    await tx.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    INTEGER     PRIMARY KEY,
        name       TEXT        NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await tx.query<{ version: number }>('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(rows.map((row) => row.version));
    const pending = [...migrations]
      .sort((a, b) => a.version - b.version)
      .filter((migration) => !appliedVersions.has(migration.version));

    for (const migration of pending) {
      await tx.query(migration.sql);
      await tx.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
        migration.version,
        migration.name,
      ]);
    }
    return pending;
  });

  for (const migration of applied) {
    logger?.info({ version: migration.version, migration: migration.name }, 'Applied migration');
  }
}
