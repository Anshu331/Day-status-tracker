'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ui/button';
import { CalendarIcon, LockIcon } from '@/components/ui/icons';
import { useCurrentUser, useLogout } from '@/features/auth/hooks';

const NAV_ITEMS = [
  { href: '/', label: 'Day Viewer', shortLabel: 'Viewer', requiresAuth: false },
  { href: '/manage', label: 'Data Input', shortLabel: 'Input', requiresAuth: true },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        if (pathname.startsWith('/manage')) router.replace('/');
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <CalendarIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">Day Status Tracker</span>
        </Link>

        <nav aria-label="Main" className="flex min-w-0 flex-1 items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-3',
                  'focus-visible:outline-2 focus-visible:outline-indigo-600',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
                {item.requiresAuth && !user && <LockIcon className="size-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 md:inline">
              Signed in as <span className="font-medium text-slate-900">{user.username}</span>
            </span>
            <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={logout.isPending}>
              Sign out
            </Button>
          </div>
        ) : (
          pathname !== '/login' && (
            <ButtonLink href="/login" size="sm">
              Sign in
            </ButtonLink>
          )
        )}
      </div>
    </header>
  );
}
