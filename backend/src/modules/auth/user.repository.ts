import type { Database } from '../../db/database.js';
import { isUniqueViolation } from '../../db/errors.js';
import { toIsoTimestamp } from '../../db/mappers.js';
import { ConflictError } from '../../lib/errors.js';

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface UserCredentials extends User {
  passwordHash: string;
}

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
}

const USER_COLUMNS = 'id, username, password_hash, created_at';

const toUser = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  createdAt: toIsoTimestamp(row.created_at),
});

export class UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: number): Promise<User | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findCredentialsByUsername(username: string): Promise<UserCredentials | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users WHERE lower(username) = lower($1)`,
      [username],
    );
    const row = rows[0];
    return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
  }

  async create(username: string, passwordHash: string): Promise<User> {
    try {
      const { rows } = await this.db.query<UserRow>(
        `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING ${USER_COLUMNS}`,
        [username, passwordHash],
      );
      if (!rows[0]) throw new Error('Failed to insert user');
      return toUser(rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError(`User "${username}" already exists`);
      throw error;
    }
  }

  async count(): Promise<number> {
    const { rows } = await this.db.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM users',
    );
    return rows[0]?.count ?? 0;
  }
}
