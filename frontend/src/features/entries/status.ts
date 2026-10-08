import type { DayStatus } from './types';

interface StatusMeta {
  label: string;
  description: string;
  dot: string;
  cell: string;
  badge: string;
  option: string;
}

export const STATUS_META: Record<DayStatus, StatusMeta> = {
  great: {
    label: 'Great',
    description: 'An excellent, highly productive day',
    dot: 'bg-emerald-500',
    cell: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    option: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  },
  good: {
    label: 'Good',
    description: 'A solid day with steady progress',
    dot: 'bg-sky-500',
    cell: 'bg-sky-100 text-sky-900 hover:bg-sky-200',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    option: 'border-sky-500 bg-sky-50 text-sky-900',
  },
  okay: {
    label: 'Okay',
    description: 'An average day, nothing special',
    dot: 'bg-amber-400',
    cell: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    option: 'border-amber-400 bg-amber-50 text-amber-900',
  },
  bad: {
    label: 'Bad',
    description: 'A difficult or unproductive day',
    dot: 'bg-rose-500',
    cell: 'bg-rose-100 text-rose-900 hover:bg-rose-200',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    option: 'border-rose-500 bg-rose-50 text-rose-900',
  },
  off: {
    label: 'Day off',
    description: 'Holiday, leave or rest day',
    dot: 'bg-slate-400',
    cell: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
    badge: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    option: 'border-slate-400 bg-slate-100 text-slate-900',
  },
};
