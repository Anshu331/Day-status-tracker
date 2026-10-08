import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/spinner';
import { DataInputManager } from '@/features/data-input/data-input-manager';

export const metadata: Metadata = { title: 'Data Input' };

export default function ManagePage() {
  return (
    <>
      <PageHeader
        title="Data Input"
        description="Every day of the year at a glance. Select a cell to record or update that day; striped cells are dates that don't exist in the selected year."
      />
      <Suspense fallback={<LoadingState />}>
        <DataInputManager />
      </Suspense>
    </>
  );
}
