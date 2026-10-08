import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-5 sm:mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}
