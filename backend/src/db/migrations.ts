export interface Migration {
  version: number;
  name: string;
  sql: string;
}

// append-only: never edit a migration once it has been applied, add a new one
export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'create_users_and_day_entries',
    sql: `
      CREATE TABLE users (
        id            INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        username      TEXT        NOT NULL CHECK (char_length(username) BETWEEN 3 AND 64),
        password_hash TEXT        NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username));

      CREATE TABLE day_entries (
        entry_date DATE        PRIMARY KEY,
        status     TEXT        NOT NULL CHECK (status IN ('great', 'good', 'okay', 'bad', 'off')),
        note       TEXT        NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
        updated_by INTEGER     REFERENCES users (id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX day_entries_updated_by_idx ON day_entries (updated_by);
    `,
  },
];
