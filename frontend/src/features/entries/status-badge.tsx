import clsx from 'clsx';
import { STATUS_META } from './status';
import { DAY_STATUSES, type DayStatus } from './types';

export function StatusBadge({ status }: { status: DayStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        meta.badge,
      )}
    >
      <span className={clsx('size-2 rounded-full', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Status legend"
      className={clsx('flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600', className)}
    >
      {DAY_STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1.5" title={STATUS_META[status].description}>
          <span className={clsx('size-2.5 rounded-full', STATUS_META[status].dot)} aria-hidden="true" />
          {STATUS_META[status].label}
        </li>
      ))}
    </ul>
  );
}
