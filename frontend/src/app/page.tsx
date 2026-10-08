import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/spinner';
import { DayStatusViewer } from '@/features/viewer/day-status-viewer';

export default function ViewerPage() {
  return (
    <>
      <PageHeader
        title="Day Status Viewer"
        description="Pick any day on the calendar to see what was recorded. Anyone can view; signed-in users can also add or edit entries."
      />
      <Suspense fallback={<LoadingState label="Loading calendar…" />}>
        <DayStatusViewer />
      </Suspense>
    </>
  );
}
