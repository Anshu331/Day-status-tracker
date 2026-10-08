import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you are looking for doesn&apos;t exist.</p>
      <ButtonLink href="/" className="mt-6">
        Back to the calendar
      </ButtonLink>
    </div>
  );
}
