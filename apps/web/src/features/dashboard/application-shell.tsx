// Provides the responsive desktop and mobile navigation frame for application pages.
import {
  Dumbbell,
  History,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import wordmarkUrl from '../../assets/goforlift-wordmark.png';
import { cn } from '../../lib/utils';

const navigationItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/routines', icon: Dumbbell, label: 'Routines' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/settings', icon: Settings, label: 'Settings' },
] as const;

type ApplicationShellProps = {
  children: ReactNode;
};

export function ApplicationShell({ children }: ApplicationShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        'lg:grid lg:grid-cols-[256px_minmax(0,1fr)]',
      )}
    >
      <aside className="hidden border-r bg-surface lg:flex lg:min-h-screen lg:flex-col">
        <Brand className="px-7 py-8" />
        <Navigation className="flex-1 space-y-1 px-4" />
      </aside>

      <div className="min-w-0">
        <header
          className={cn(
            'sticky top-0 z-20 flex h-16 items-center px-5',
            'border-b bg-surface/95 backdrop-blur',
            'lg:hidden',
          )}
        >
          <Brand />
        </header>
        <main
          className={cn(
            'mx-auto w-full max-w-[1440px] px-5 py-7 pb-28',
            'sm:px-8',
            'lg:px-10 lg:py-9 lg:pb-10',
          )}
        >
          {children}
        </main>
      </div>

      <Navigation
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 px-2 pt-2',
          'border-t bg-surface/95 backdrop-blur',
          'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
          'lg:hidden',
        )}
      />
    </div>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <Link
      aria-label="GoForLift dashboard"
      className={cn('block', className)}
      to="/dashboard"
    >
      <img alt="GoForLift" className="h-auto w-[132px]" src={wordmarkUrl} />
    </Link>
  );
}

type NavigationProps = {
  className?: string;
};

function Navigation({ className }: NavigationProps) {
  return (
    <nav aria-label="Primary navigation" className={className}>
      {navigationItems.map((item) => (
        <NavigationItem
          href={item.href}
          icon={item.icon}
          key={item.href}
          label={item.label}
        />
      ))}
    </nav>
  );
}

type NavigationItemProps = {
  href: (typeof navigationItems)[number]['href'];
  icon: LucideIcon;
  label: string;
};

function NavigationItem({ href, icon: Icon, label }: NavigationItemProps) {
  return (
    <Link
      activeOptions={{ exact: true }}
      activeProps={{
        className:
          'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary',
      }}
      className={cn(
        'flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px]',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-sm lg:font-medium',
      )}
      inactiveProps={{
        className:
          'text-muted-foreground hover:bg-accent hover:text-foreground',
      }}
      to={href}
    >
      <Icon aria-hidden="true" className="size-5 lg:size-[18px]" />
      <span>{label}</span>
    </Link>
  );
}
