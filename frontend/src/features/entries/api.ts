import { apiRequest, isApiError } from '@/lib/api-client';
import type { DayEntry, UpsertEntryInput } from './types';

interface DataEnvelope<T> {
  data: T;
}

export const entriesApi = {
  async list(from: string, to: string): Promise<DayEntry[]> {
    const params = new URLSearchParams({ from, to });
    const { data } = await apiRequest<DataEnvelope<DayEntry[]>>(`/entries?${params}`);
    return data;
  },

  async get(date: string): Promise<DayEntry | null> {
    try {
      const { data } = await apiRequest<DataEnvelope<DayEntry>>(`/entries/${date}`);
      return data;
    } catch (error) {
      if (isApiError(error, 404)) return null;
      throw error;
    }
  },

  async upsert(date: string, input: UpsertEntryInput): Promise<DayEntry> {
    const { data } = await apiRequest<DataEnvelope<DayEntry>>(`/entries/${date}`, {
      method: 'PUT',
      json: input,
    });
    return data;
  },

  remove(date: string): Promise<void> {
    return apiRequest<void>(`/entries/${date}`, { method: 'DELETE' });
  },
};
