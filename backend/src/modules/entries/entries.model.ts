export const DAY_STATUSES = ['great', 'good', 'okay', 'bad', 'off'] as const;

export type DayStatus = (typeof DAY_STATUSES)[number];

export const NOTE_MAX_LENGTH = 1000;

export const MAX_RANGE_DAYS = 366;

export interface DayEntry {
  date: string;
  status: DayStatus;
  note: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertEntryInput {
  status: DayStatus;
  note: string;
}
