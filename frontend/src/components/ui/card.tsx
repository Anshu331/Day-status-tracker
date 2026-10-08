import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={clsx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}
