'use client';

import clsx from 'clsx';
import { memo, useEffect, useRef } from 'react';
import { STATUS_META } from '@/features/entries/status';
import type { DayEntry } from '@/features/entries/types';
import { daysInMonth, formatLongDate, MONTHS, toIsoDate } from '@/lib/date';

const DAY_NUMBERS = Array.from({ length: 31 }, (_, index) => index + 1);
const MONTH_INDEXES = MONTHS.map((_, index) => index);

interface YearGridProps {
  year: number;
  today: string;
  entriesByDate: ReadonlyMap<string, DayEntry>;
  isLoading?: boolean;
  onSelectDate: (date: string) => void;
}

export function YearGrid({ year, today, entriesByDate, isLoading = false, onSelectDate }: YearGridProps) {
  const monthLengths = MONTH_INDEXES.map((month) => daysInMonth(year, month));
  const scrollRef = useRef<HTMLDivElement>(null);

  // on small screens most of the year is off-screen, so start with today's cell in view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cell = container.querySelector<HTMLElement>('[data-today]');
    if (!cell) {
      container.scrollTo({ left: 0, top: 0 });
      return;
    }
    const box = container.getBoundingClientRect();
    const target = cell.getBoundingClientRect();
    container.scrollTo({
      left: container.scrollLeft + target.left - box.left - (box.width - target.width) / 2,
      top: container.scrollTop + target.top - box.top - (box.height - target.height) / 2,
    });
  }, [year]);

  return (
    <div
      ref={scrollRef}
      className={clsx(
        'max-h-[calc(100dvh-15rem)] min-h-80 overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity',
        isLoading && 'opacity-60',
      )}
      aria-busy={isLoading}
    >
      <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-sm sm:min-w-[60rem]">
        <caption className="sr-only">
          Day entries for {year}. Rows are days of the month, columns are months. Select a cell to
          add or edit that day.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 left-0 z-30 w-10 border-b border-slate-200 bg-slate-50 px-2 py-3 text-left text-xs font-semibold text-slate-500 sm:w-14"
            >
              Day
            </th>
            {MONTH_INDEXES.map((month) => (
              <th
                key={month}
                scope="col"
                className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-1 py-3 text-center text-xs font-semibold text-slate-600"
              >
                <abbr title={MONTHS[month]} className="no-underline">
                  {MONTHS[month]!.slice(0, 3)}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAY_NUMBERS.map((day) => (
            <tr key={day}>
              <th
                scope="row"
                className="sticky left-0 z-10 border-b border-slate-100 bg-white px-2 text-left text-xs font-medium text-slate-500 tabular-nums"
              >
                {day}
              </th>
              {MONTH_INDEXES.map((month) => {
                if (day > monthLengths[month]!) {
                  return (
                    <td key={month} className="border-b border-slate-100 p-0.5">
                      <div
                        className="cell-invalid h-10 rounded-md sm:h-9"
                        title={`${MONTHS[month]} has no day ${day} in ${year}`}
                      />
                    </td>
                  );
                }

                const date = toIsoDate(year, month, day);
                return (
                  <td key={month} className="border-b border-slate-100 p-0.5">
                    <GridCell
                      date={date}
                      entry={entriesByDate.get(date)}
                      isToday={date === today}
                      onSelect={onSelectDate}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface GridCellProps {
  date: string;
  entry: DayEntry | undefined;
  isToday: boolean;
  onSelect: (date: string) => void;
}

const GridCell = memo(function GridCell({ date, entry, isToday, onSelect }: GridCellProps) {
  const meta = entry ? STATUS_META[entry.status] : null;
  const label = `${formatLongDate(date)}: ${meta ? meta.label : 'no entry'}${entry?.note ? ` – ${entry.note}` : ''}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      data-today={isToday || undefined}
      aria-label={`${label}. Edit`}
      title={label}
      className={clsx(
        'relative flex h-10 w-full items-center justify-center rounded-md px-1 text-xs font-medium transition-colors sm:h-9',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600',
        meta ? meta.cell : 'text-slate-300 hover:bg-indigo-50 hover:text-indigo-500',
        isToday && 'ring-2 ring-indigo-500 ring-inset',
      )}
    >
      {meta ? <span className="hidden truncate sm:inline">{meta.label}</span> : '+'}
      {entry?.note && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 size-1.5 rounded-full bg-current opacity-60"
        />
      )}
    </button>
  );
});
