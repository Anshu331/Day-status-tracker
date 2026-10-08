// Dates are YYYY-MM-DD strings and all arithmetic is in UTC so the user's timezone can't
// shift a day. Months are 0-based here (0 = January), like JS Date.
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAYS = [
  { short: 'Sun', long: 'Sunday' },
  { short: 'Mon', long: 'Monday' },
  { short: 'Tue', long: 'Tuesday' },
  { short: 'Wed', long: 'Wednesday' },
  { short: 'Thu', long: 'Thursday' },
  { short: 'Fri', long: 'Friday' },
  { short: 'Sat', long: 'Saturday' },
] as const;

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface MonthRef {
  year: number;
  month: number;
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month + 1)}-${pad(day)}`;
}

export function parseIsoDate(iso: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  if (year < MIN_YEAR || year > MAX_YEAR || month < 0 || month > 11) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export const isValidIsoDate = (iso: string): boolean => parseIsoDate(iso) !== null;

function requireDate(iso: string): CalendarDate {
  const date = parseIsoDate(iso);
  if (!date) throw new RangeError(`Invalid ISO date: ${iso}`);
  return date;
}

function fromUtc(date: Date): string {
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(iso: string, amount: number): string {
  const { year, month, day } = requireDate(iso);
  return fromUtc(new Date(Date.UTC(year, month, day + amount)));
}

// clamps the day, e.g. 31 Jan + 1 month = 28/29 Feb
export function addMonths(iso: string, amount: number): string {
  const { year, month, day } = requireDate(iso);
  const target = shiftMonth({ year, month }, amount);
  return toIsoDate(target.year, target.month, Math.min(day, daysInMonth(target.year, target.month)));
}

export function shiftMonth({ year, month }: MonthRef, amount: number): MonthRef {
  const index = year * 12 + month + amount;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

export function monthOf(iso: string): MonthRef {
  const { year, month } = requireDate(iso);
  return { year, month };
}

export function monthRange({ year, month }: MonthRef): { from: string; to: string } {
  return { from: toIsoDate(year, month, 1), to: toIsoDate(year, month, daysInMonth(year, month)) };
}

export function yearRange(year: number): { from: string; to: string } {
  return { from: toIsoDate(year, 0, 1), to: toIsoDate(year, 11, 31) };
}

export function isLeapYear(year: number): boolean {
  return daysInMonth(year, 1) === 29;
}

// weeks start on Sunday; null = padding for days outside the month
export function buildMonthMatrix({ year, month }: MonthRef): (string | null)[][] {
  const leadingBlanks = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const cells: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);

  for (let day = 1; day <= daysInMonth(year, month); day++) {
    cells.push(toIsoDate(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' });

const dayMonthYearFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const toUtcDate = (iso: string) => {
  const { year, month, day } = requireDate(iso);
  return new Date(Date.UTC(year, month, day));
};

export const formatLongDate = (iso: string): string => longDateFormatter.format(toUtcDate(iso));

export const formatWeekday = (iso: string): string => weekdayFormatter.format(toUtcDate(iso));

export const formatDate = (iso: string): string => dayMonthYearFormatter.format(toUtcDate(iso));

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatTimestamp(isoTimestamp: string): string {
  return timestampFormatter.format(new Date(isoTimestamp));
}
