'use client';

import clsx from 'clsx';
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api-client';
import { formatLongDate } from '@/lib/date';
import { useDeleteEntry, useSaveEntry } from './hooks';
import { STATUS_META } from './status';
import { DAY_STATUSES, NOTE_MAX_LENGTH, type DayEntry, type DayStatus } from './types';

export type EntryFormResult = 'saved' | 'deleted';

interface EntryFormProps {
  date: string;
  entry: DayEntry | null;
  onDone?: (result: EntryFormResult) => void;
  onCancel?: () => void;
}

export function EntryForm({ date, entry, onDone, onCancel }: EntryFormProps) {
  const [status, setStatus] = useState<DayStatus | null>(entry?.status ?? null);
  const [note, setNote] = useState(entry?.note ?? '');
  const saveEntry = useSaveEntry();
  const deleteEntry = useDeleteEntry();
  const fieldId = useId();

  const isBusy = saveEntry.isPending || deleteEntry.isPending;
  const isDirty = status !== (entry?.status ?? null) || note.trim() !== (entry?.note ?? '');
  const canSubmit = status !== null && isDirty && !isBusy;
  const error = saveEntry.error ?? deleteEntry.error;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || status === null) return;
    saveEntry.mutate(
      { date, input: { status, note: note.trim() } },
      { onSuccess: () => onDone?.('saved') },
    );
  };

  const handleDelete = () => {
    if (!entry || !window.confirm(`Delete the entry for ${formatLongDate(date)}?`)) return;
    deleteEntry.mutate(date, { onSuccess: () => onDone?.('deleted') });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Status</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DAY_STATUSES.map((option) => {
            const meta = STATUS_META[option];
            const isSelected = status === option;
            return (
              <label
                key={option}
                title={meta.description}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors sm:py-2',
                  'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-indigo-600',
                  isSelected
                    ? meta.option
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <input
                  type="radio"
                  name={`${fieldId}-status`}
                  value={option}
                  checked={isSelected}
                  onChange={() => setStatus(option)}
                  className="sr-only"
                />
                <span className={clsx('size-2.5 rounded-full', meta.dot)} aria-hidden="true" />
                {meta.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${fieldId}-note`} className="text-sm font-medium text-slate-700">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <span className="text-xs text-slate-400 tabular-nums" aria-live="polite">
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={`${fieldId}-note`}
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What happened on this day?"
          className="mt-2 block w-full resize-y rounded-lg border-0 px-3 py-2 text-base text-slate-900 sm:text-sm shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {getErrorMessage(error)}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {entry ? (
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            onClick={handleDelete}
            isLoading={deleteEntry.isPending}
            disabled={isBusy}
          >
            Delete
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className={clsx('grid gap-2 sm:flex', onCancel ? 'grid-cols-2' : 'grid-cols-1')}>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
              Cancel
            </Button>
          )}
          <Button type="submit" isLoading={saveEntry.isPending} disabled={!canSubmit}>
            {entry ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      </div>
    </form>
  );
}
