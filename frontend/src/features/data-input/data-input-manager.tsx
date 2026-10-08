'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LoadingState } from '@/components/ui/spinner';
import { useCurrentUser } from '@/features/auth/hooks';
import { EntryForm } from '@/features/entries/entry-form';
import { useEntriesInRange } from '@/features/entries/hooks';
import { getErrorMessage } from '@/lib/api-client';
import { formatLongDate, MAX_YEAR, MIN_YEAR, todayIso, yearRange } from '@/lib/date';
import { useHasMounted } from '@/lib/use-has-mounted';
import { YearGrid } from './year-grid';
import { YearSummary, YearSwitcher } from './year-toolbar';

function parseYear(value: string | null, fallback: number): number {
  const year = Number(value);
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : fallback;
}

export function DataInputManager() {
  const router = useRouter();
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const { data: user, isPending, isError } = useCurrentUser();
  const isSignedOut = !isPending && !isError && !user;

  useEffect(() => {
    if (isSignedOut) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isSignedOut, pathname, router]);

  if (isError) {
    return <p role="alert" className="py-16 text-center text-sm text-rose-700">Unable to verify your session. Please refresh the page.</p>;
  }
  if (!hasMounted || isPending || !user) return <LoadingState label="Checking your session…" />;
  return <DataInputWorkspace />;
}

function DataInputWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = todayIso();
  const currentYear = Number(today.slice(0, 4));
  const year = parseYear(searchParams.get('year'), currentYear);

  const { from, to } = yearRange(year);
  const entriesQuery = useEntriesInRange(from, to);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const activeEntry = activeDate ? (entriesQuery.entriesByDate.get(activeDate) ?? null) : null;

  const changeYear = (nextYear: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextYear === currentYear) params.delete('year');
    else params.set('year', String(nextYear));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <YearSwitcher year={year} currentYear={currentYear} onChange={changeYear} />
        <YearSummary year={year} entries={entriesQuery.data ?? []} />
      </div>

      {entriesQuery.isError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p>Couldn&apos;t load entries: {getErrorMessage(entriesQuery.error)}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => entriesQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : entriesQuery.isPending ? (
        <LoadingState label={`Loading ${year}…`} />
      ) : (
        <YearGrid
          year={year}
          today={today}
          entriesByDate={entriesQuery.entriesByDate}
          isLoading={entriesQuery.isPlaceholderData}
          onSelectDate={setActiveDate}
        />
      )}

      <Modal
        open={activeDate !== null}
        onClose={() => setActiveDate(null)}
        title={activeDate ? formatLongDate(activeDate) : ''}
        description={activeEntry ? 'Update or remove the entry for this day.' : 'Record how this day went.'}
      >
        {activeDate && (
          <EntryForm
            key={`${activeDate}:${activeEntry?.updatedAt ?? 'new'}`}
            date={activeDate}
            entry={activeEntry}
            onDone={() => setActiveDate(null)}
            onCancel={() => setActiveDate(null)}
          />
        )}
      </Modal>
    </div>
  );
}
