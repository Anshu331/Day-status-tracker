'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/spinner';
import { useEntriesInRange } from '@/features/entries/hooks';
import { StatusLegend } from '@/features/entries/status-badge';
import { getErrorMessage } from '@/lib/api-client';
import { isValidIsoDate, monthOf, monthRange, todayIso, type MonthRef } from '@/lib/date';
import { useHasMounted } from '@/lib/use-has-mounted';
import { Calendar } from './calendar';
import { DayDetails } from './day-details';

export function DayStatusViewer() {
  const hasMounted = useHasMounted();
  if (!hasMounted) return <LoadingState label="Loading calendar…" />;
  return <DayStatusViewerContent />;
}

function DayStatusViewerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = todayIso();
  const dateParam = searchParams.get('date');
  const selectedDate = dateParam && isValidIsoDate(dateParam) ? dateParam : today;

  const detailsRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MonthRef>(() => monthOf(selectedDate));
  const [trackedDate, setTrackedDate] = useState(selectedDate);
  if (trackedDate !== selectedDate) {
    setTrackedDate(selectedDate);
    setView(monthOf(selectedDate));
  }

  const { from, to } = monthRange(view);
  const entriesQuery = useEntriesInRange(from, to);

  const selectDate = (date: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('date', date);
    router.replace(`${pathname}?${params}`, { scroll: false });

    // on phones the details card is below the calendar; bring it up if it's out of sight
    const details = detailsRef.current;
    if (details && details.getBoundingClientRect().top > window.innerHeight - 160) {
      details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Card className="p-4 sm:p-6">
        <Calendar
          view={view}
          selectedDate={selectedDate}
          today={today}
          entriesByDate={entriesQuery.entriesByDate}
          isLoading={entriesQuery.isFetching}
          onSelectDate={selectDate}
          onViewChange={setView}
        />
        {entriesQuery.isError && (
          <p role="alert" className="mt-4 text-sm text-rose-700">
            Couldn&apos;t load entries for this month: {getErrorMessage(entriesQuery.error)}
          </p>
        )}
        <StatusLegend className="mt-6 border-t border-slate-100 pt-4" />
      </Card>

      <div ref={detailsRef} className="scroll-mt-20 lg:sticky lg:top-24">
        <Card className="p-4 sm:p-6">
          <DayDetails key={selectedDate} date={selectedDate} />
        </Card>
      </div>
    </div>
  );
}
