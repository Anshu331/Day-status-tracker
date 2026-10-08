import { describe, expect, it } from 'vitest';
import { daysBetween, daysInMonth, isValidIsoDate, parseIsoDate } from '../src/lib/date.js';

describe('date utilities', () => {
  it.each([
    [2024, 2, 29],
    [2025, 2, 28],
    [1900, 2, 28],
    [2000, 2, 29],
    [2026, 4, 30],
    [2026, 12, 31],
  ])('daysInMonth(%i, %i) is %i', (year, month, expected) => {
    expect(daysInMonth(year, month)).toBe(expected);
  });

  it('parses valid ISO dates', () => {
    expect(parseIsoDate('2026-10-08')).toEqual({ year: 2026, month: 10, day: 8 });
  });

  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-1-1', '26-01-01', 'abc', '1899-12-31'])(
    'rejects %s',
    (value) => {
      expect(isValidIsoDate(value)).toBe(false);
    },
  );

  it('counts days between dates across a leap day', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
    expect(daysBetween('2024-03-01', '2024-02-28')).toBe(-2);
  });
});
