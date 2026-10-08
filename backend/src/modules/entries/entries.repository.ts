import type { Database } from '../../db/database.js';
import { toIsoTimestamp } from '../../db/mappers.js';
import type { DayEntry, DayStatus, UpsertEntryInput } from './entries.model.js';

interface DayEntryRow {
  entry_date: string;
  status: DayStatus;
  note: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

// to_char so pg returns the date as a plain string instead of a timezone-shifted JS Date
const ENTRY_COLUMNS = `
  to_char(e.entry_date, 'YYYY-MM-DD') AS entry_date,
  e.status,
  e.note,
  u.username AS updated_by,
  e.created_at,
  e.updated_at
`;

const SELECT_ENTRIES = `
  SELECT ${ENTRY_COLUMNS}
  FROM day_entries e
  LEFT JOIN users u ON u.id = e.updated_by
`;

const toEntry = (row: DayEntryRow): DayEntry => ({
  date: row.entry_date,
  status: row.status,
  note: row.note,
  updatedBy: row.updated_by,
  createdAt: toIsoTimestamp(row.created_at),
  updatedAt: toIsoTimestamp(row.updated_at),
});

export class EntriesRepository {
  constructor(private readonly db: Database) {}

  async findByDate(date: string): Promise<DayEntry | null> {
    const { rows } = await this.db.query<DayEntryRow>(
      `${SELECT_ENTRIES} WHERE e.entry_date = $1::date`,
      [date],
    );
    return rows[0] ? toEntry(rows[0]) : null;
  }

  async findInRange(from: string, to: string): Promise<DayEntry[]> {
    const { rows } = await this.db.query<DayEntryRow>(
      `${SELECT_ENTRIES} WHERE e.entry_date BETWEEN $1::date AND $2::date ORDER BY e.entry_date`,
      [from, to],
    );
    return rows.map(toEntry);
  }

  // xmax = 0 only for freshly inserted rows, so we know whether it was a create or an update
  async upsert(
    date: string,
    input: UpsertEntryInput,
    userId: number,
  ): Promise<{ entry: DayEntry; created: boolean }> {
    const { rows } = await this.db.query<DayEntryRow & { created: boolean }>(
      `
        WITH saved AS (
          INSERT INTO day_entries (entry_date, status, note, updated_by)
          VALUES ($1::date, $2, $3, $4)
          ON CONFLICT (entry_date) DO UPDATE SET
            status     = EXCLUDED.status,
            note       = EXCLUDED.note,
            updated_by = EXCLUDED.updated_by,
            updated_at = now()
          RETURNING *, (xmax = 0) AS created
        )
        SELECT ${ENTRY_COLUMNS}, e.created
        FROM saved e
        LEFT JOIN users u ON u.id = e.updated_by
      `,
      [date, input.status, input.note, userId],
    );

    const row = rows[0];
    if (!row) throw new Error(`Failed to persist entry for ${date}`);
    return { entry: toEntry(row), created: row.created };
  }

  async delete(date: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM day_entries WHERE entry_date = $1::date', [
      date,
    ]);
    return rowCount > 0;
  }
}
