'use client';

import clsx from 'clsx';
import { useEffect, useId, useMemo, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { STATUS_META } from '@/features/entries/status';
import type { DayEntry } from '@/features/entries/types';
import {
  addDays,
  addMonths,
  buildMonthMatrix,
  formatLongDate,
  MAX_YEAR,
  MIN_YEAR,
  MONTHS,
  monthOf,
  shiftMonth,
  toIsoDate,
  WEEKDAYS,
  type MonthRef,
} from '@/lib/date';

interface CalendarProps {
  view: MonthRef;
  selectedDate: string;
  today: string;
  entriesByDate: ReadonlyMap<string, DayEntry>;
  isLoading?: boolean;
  onSelectDate: (date: string) => void;
  onViewChange: (view: MonthRef) => void;
}

const KEY_DAY_OFFSETS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

const isWithinSupportedRange = ({ year }: MonthRef) => year >= MIN_YEAR && year <= MAX_YEAR;

// Arrow keys move by day/week, PageUp/PageDown by month.
export function Calendar({
  view,
  selectedDate,
  today,
  entriesByDate,
  isLoading = false,
  onSelectDate,
  onViewChange,
}: CalendarProps) {
  const titleId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocusSelection = useRef(false);
  const weeks = useMemo(() => buildMonthMatrix(view), [view]);

  const selectedMonth = monthOf(selectedDate);
  const isSelectionVisible = selectedMonth.year === view.year && selectedMonth.month === view.month;
  const tabStopDate = isSelectionVisible ? selectedDate : toIsoDate(view.year, view.month, 1);

  useEffect(() => {
    if (!shouldFocusSelection.current) return;
    shouldFocusSelection.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${selectedDate}"]`)?.focus();
  }, [selectedDate, view]);

  const moveSelection = (date: string) => {
    if (!isWithinSupportedRange(monthOf(date))) return;
    shouldFocusSelection.current = true;
    onSelectDate(date);
  };

  const handleDayKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const dayOffset = KEY_DAY_OFFSETS[event.key];
    let target: string | null = null;

    if (dayOffset !== undefined) target = addDays(date, dayOffset);
    else if (event.key === 'PageUp') target = addMonths(date, -1);
    else if (event.key === 'PageDown') target = addMonths(date, 1);

    if (target) {
      event.preventDefault();
      moveSelection(target);
    }
  };

  const previousMonth = shiftMonth(view, -1);
  const nextMonth = shiftMonth(view, 1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} aria-live="polite" className="text-base font-semibold text-slate-900 sm:text-lg">
          {MONTHS[view.month]} {view.year}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => onSelectDate(today)}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Previous month, ${MONTHS[previousMonth.month]} ${previousMonth.year}`}
            disabled={!isWithinSupportedRange(previousMonth)}
            onClick={() => onViewChange(previousMonth)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Next month, ${MONTHS[nextMonth.month]} ${nextMonth.year}`}
            disabled={!isWithinSupportedRange(nextMonth)}
            onClick={() => onViewChange(nextMonth)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-labelledby={titleId}
        aria-busy={isLoading}
        className={clsx('mt-4 transition-opacity', isLoading && 'opacity-60')}
      >
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday.short}
              role="columnheader"
              aria-label={weekday.long}
              className="py-2 text-center text-xs font-medium tracking-wide text-slate-500 uppercase"
            >
              {weekday.short}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="mt-1 grid grid-cols-7 gap-1">
            {week.map((date, dayIndex) => {
              if (!date) return <div key={`blank-${dayIndex}`} role="gridcell" />;

              const entry = entriesByDate.get(date);
              const isSelected = date === selectedDate;
              const isToday = date === today;
              const label = [
                formatLongDate(date),
                isToday ? 'today' : null,
                entry ? `status ${STATUS_META[entry.status].label}` : 'no entry',
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <div key={date} role="gridcell" aria-selected={isSelected}>
                  <button
                    type="button"
                    data-date={date}
                    tabIndex={date === tabStopDate ? 0 : -1}
                    aria-label={label}
                    aria-current={isToday ? 'date' : undefined}
                    onClick={() => onSelectDate(date)}
                    onKeyDown={(event) => handleDayKeyDown(event, date)}
                    className={clsx(
                      'relative flex h-11 w-full items-center justify-center rounded-xl text-sm tabular-nums transition-colors sm:h-14',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                      isSelected
                        ? 'bg-indigo-600 font-semibold text-white shadow-sm'
                        : isToday
                          ? 'bg-indigo-50 font-semibold text-indigo-700 hover:bg-indigo-100'
                          : 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    {Number(date.slice(8))}
                    {entry && (
                      <span
                        aria-hidden="true"
                        className={clsx(
                          'absolute bottom-1.5 size-1.5 rounded-full sm:bottom-2 sm:size-2',
                          STATUS_META[entry.status].dot,
                          isSelected && 'ring-2 ring-white',
                        )}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
