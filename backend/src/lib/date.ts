// Dates are plain YYYY-MM-DD strings; all arithmetic is done in UTC so the server
// timezone can never shift a day.
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;

  return { year, month, day };
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

export function daysBetween(from: string, to: string): number {
  const toUtc = (iso: string) => {
    const date = parseIsoDate(iso);
    if (!date) throw new RangeError(`Invalid ISO date: ${iso}`);
    return Date.UTC(date.year, date.month - 1, date.day);
  };
  return Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);
}
