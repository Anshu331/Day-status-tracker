'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { LockIcon, PencilIcon, PlusIcon } from '@/components/ui/icons';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser } from '@/features/auth/hooks';
import { EntryForm } from '@/features/entries/entry-form';
import { useEntry } from '@/features/entries/hooks';
import { StatusBadge } from '@/features/entries/status-badge';
import { STATUS_META } from '@/features/entries/status';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate, formatTimestamp, formatWeekday } from '@/lib/date';

export function DayDetails({ date }: { date: string }) {
  const { data: user } = useCurrentUser();
  const entryQuery = useEntry(date);
  const [isEditing, setIsEditing] = useState(false);

  const entry = entryQuery.data ?? null;
  const canEdit = Boolean(user);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-100 pb-4">
        <p className="text-sm font-medium text-indigo-600">{formatWeekday(date)}</p>
        <h2 className="text-xl font-semibold text-slate-900">{formatDate(date)}</h2>
      </header>

      <div className="flex-1 pt-5" aria-live="polite">
        {entryQuery.isPending ? (
          <div role="status" className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="size-4" /> Loading entry…
          </div>
        ) : entryQuery.isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-rose-700">{getErrorMessage(entryQuery.error)}</p>
            <Button variant="secondary" size="sm" onClick={() => entryQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : isEditing && canEdit ? (
          <EntryForm
            key={entry?.updatedAt ?? 'new'}
            date={date}
            entry={entry}
            onDone={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-5">
            {entry ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <StatusBadge status={entry.status} />
                  <span className="text-sm text-slate-500">{STATUS_META[entry.status].description}</span>
                </div>
                {entry.note ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                    {entry.note}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No note was added for this day.</p>
                )}
                <p className="text-xs text-slate-400">
                  Last updated {formatTimestamp(entry.updatedAt)}
                  {entry.updatedBy && <> by {entry.updatedBy}</>}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">Nothing recorded for this day</p>
                <p className="mt-1 text-sm text-slate-500">
                  {canEdit ? 'Add an entry to record how the day went.' : 'Check back later.'}
                </p>
              </div>
            )}

            {canEdit ? (
              <Button onClick={() => setIsEditing(true)}>
                {entry ? <PencilIcon className="size-4" /> : <PlusIcon className="size-4" />}
                {entry ? 'Edit entry' : 'Add entry'}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <LockIcon className="size-4 text-slate-400" />
                <span className="flex-1">View only. Sign in to add or edit entries.</span>
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(`/?date=${date}`)}`}
                  variant="secondary"
                  size="sm"
                >
                  Sign in
                </ButtonLink>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
