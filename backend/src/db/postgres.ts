import pg from 'pg';
import type { Logger } from '../lib/logger.js';
import type { Database, Queryable, QueryResult } from './database.js';

export interface PostgresOptions {
  connectionString: string;
  maxConnections: number;
  logger: Logger;
}

const toQueryable = (client: pg.Pool | pg.PoolClient): Queryable => ({
  async query<T>(text: string, params?: readonly unknown[]): Promise<QueryResult<T>> {
    const result = await client.query(text, params as unknown[] | undefined);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  },
});

export function createPostgresDatabase({
  connectionString,
  maxConnections,
  logger,
}: PostgresOptions): Database {
  const pool = new pg.Pool({
    connectionString,
    max: maxConnections,
    idleTimeoutMillis: 30_000,
    // Neon can take a few seconds to wake up after auto-suspend
    connectionTimeoutMillis: 15_000,
    application_name: 'day-status-tracker',
  });

  // Neon drops idle connections; an unhandled 'error' event would crash the process
  pool.on('error', (error) => logger.warn({ err: error }, 'Idle PostgreSQL client error'));

  const poolQueryable = toQueryable(pool);

  return {
    query: poolQueryable.query,

    async transaction<T>(work: (tx: Queryable) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await work(toQueryable(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },

    close: () => pool.end(),
  };
}
