import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../src/db/migrate.js';
import { migrations } from '../src/db/migrations.js';
import { createTestDatabase, type TestDatabase } from './helpers.js';

describe('database migrations', () => {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(() => testDb.close());

  it('records every migration exactly once and is idempotent', async () => {
    await runMigrations(testDb.db);
    await runMigrations(testDb.db);

    const { rows } = await testDb.db.query<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    expect(rows.map((row) => row.version)).toEqual(migrations.map((migration) => migration.version));
  });

  it('enforces data integrity at the database level', async () => {
    await expect(
      testDb.db.query(`INSERT INTO day_entries (entry_date, status) VALUES ('2026-01-01', 'unknown')`),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      testDb.db.query(`INSERT INTO day_entries (entry_date, status) VALUES ('2026-02-30', 'good')`),
    ).rejects.toMatchObject({ code: '22008' });
  });

  it('rolls back a failing migration without leaving partial changes', async () => {
    const broken = [
      ...migrations,
      { version: 999, name: 'broken', sql: 'CREATE TABLE half_done (id INT); SELECT * FROM missing_table;' },
    ];

    await expect(runMigrations(testDb.db, undefined, broken)).rejects.toThrow();

    const { rows } = await testDb.db.query<{ exists: boolean }>(
      "SELECT to_regclass('half_done') IS NOT NULL AS exists",
    );
    expect(rows[0]?.exists).toBe(false);
  });
});
