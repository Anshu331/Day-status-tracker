'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { STATUS_META } from '@/features/entries/status';
import { DAY_STATUSES, type DayEntry, type DayStatus } from '@/features/entries/types';
import { isLeapYear, MAX_YEAR, MIN_YEAR } from '@/lib/date';

interface YearSwitcherProps {
  year: number;
  currentYear: number;
  onChange: (year: number) => void;
}

export function YearSwitcher({ year, currentYear, onChange }: YearSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg bg-white shadow-sm ring-1 ring-slate-300 ring-inset">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Previous year, ${year - 1}`}
          disabled={year <= MIN_YEAR}
          onClick={() => onChange(year - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="min-w-16 text-center text-base font-semibold text-slate-900 tabular-nums" aria-live="polite">
          {year}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Next year, ${year + 1}`}
          disabled={year >= MAX_YEAR}
          onClick={() => onChange(year + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      {year !== currentYear && (
        <Button variant="secondary" size="sm" onClick={() => onChange(currentYear)}>
          This year
        </Button>
      )}
    </div>
  );
}

export function YearSummary({ year, entries }: { year: number; entries: readonly DayEntry[] }) {
  const counts = useMemo(() => {
    const result = Object.fromEntries(DAY_STATUSES.map((status) => [status, 0])) as Record<DayStatus, number>;
    for (const entry of entries) result[entry.status] += 1;
    return result;
  }, [entries]);

  const totalDays = isLeapYear(year) ? 366 : 365;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <p className="text-slate-600">
        <span className="font-semibold text-slate-900 tabular-nums">{entries.length}</span> of{' '}
        {totalDays} days recorded
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Entries per status">
        {DAY_STATUSES.map((status) => (
          <li
            key={status}
            title={STATUS_META[status].description}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
          >
            <span className={clsx('size-2 rounded-full', STATUS_META[status].dot)} aria-hidden="true" />
            {STATUS_META[status].label}
            <span className="font-semibold text-slate-900 tabular-nums">{counts[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
