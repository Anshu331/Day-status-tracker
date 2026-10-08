import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { LockIcon } from '@/components/ui/icons';
import { LoadingState } from '@/components/ui/spinner';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md pt-4 sm:pt-12">
      <Card className="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-indigo-50 text-indigo-600">
            <LockIcon />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Sign in to edit entries</h1>
          <p className="mt-1 text-sm text-slate-500">
            Viewing the calendar is public. Editing requires an account.
          </p>
        </div>
        <Suspense fallback={<LoadingState />}>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  );
}
