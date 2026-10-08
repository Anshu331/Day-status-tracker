'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { entriesApi } from './api';
import type { DayEntry, UpsertEntryInput } from './types';

export const entryKeys = {
  all: ['entries'] as const,
  range: (from: string, to: string) => [...entryKeys.all, 'range', from, to] as const,
  detail: (date: string) => [...entryKeys.all, 'detail', date] as const,
};

export function useEntriesInRange(from: string, to: string) {
  const query = useQuery({
    queryKey: entryKeys.range(from, to),
    queryFn: () => entriesApi.list(from, to),
    placeholderData: keepPreviousData,
  });

  const entriesByDate = useMemo(
    () => new Map<string, DayEntry>((query.data ?? []).map((entry) => [entry.date, entry])),
    [query.data],
  );

  return { ...query, entriesByDate };
}

export function useEntry(date: string) {
  return useQuery({
    queryKey: entryKeys.detail(date),
    queryFn: () => entriesApi.get(date),
  });
}

export function useSaveEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, input }: { date: string; input: UpsertEntryInput }) =>
      entriesApi.upsert(date, input),
    onSuccess: (entry) => {
      queryClient.setQueryData(entryKeys.detail(entry.date), entry);
      return queryClient.invalidateQueries({ queryKey: entryKeys.all });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => entriesApi.remove(date),
    onSuccess: (_result, date) => {
      queryClient.setQueryData(entryKeys.detail(date), null);
      return queryClient.invalidateQueries({ queryKey: entryKeys.all });
    },
  });
}
