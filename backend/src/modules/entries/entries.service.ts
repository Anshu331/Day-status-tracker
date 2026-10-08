import { NotFoundError } from '../../lib/errors.js';
import type { User } from '../auth/user.repository.js';
import type { DayEntry, UpsertEntryInput } from './entries.model.js';
import type { EntriesRepository } from './entries.repository.js';

export class EntriesService {
  constructor(private readonly entries: EntriesRepository) {}

  listInRange(from: string, to: string): Promise<DayEntry[]> {
    return this.entries.findInRange(from, to);
  }

  async getByDate(date: string): Promise<DayEntry> {
    const entry = await this.entries.findByDate(date);
    if (!entry) throw new NotFoundError(`No entry recorded for ${date}`);
    return entry;
  }

  save(
    date: string,
    input: UpsertEntryInput,
    actor: User,
  ): Promise<{ entry: DayEntry; created: boolean }> {
    return this.entries.upsert(date, input, actor.id);
  }

  async remove(date: string): Promise<void> {
    if (!(await this.entries.delete(date))) {
      throw new NotFoundError(`No entry recorded for ${date}`);
    }
  }
}
