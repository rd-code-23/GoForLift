// Provides the responsive desktop and mobile navigation frame for application pages.
import {
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';

import wordmarkUrl from '../../assets/goforlift-wordmark.png';
import { cn } from '../../lib/utils';
import type { ApplicationIdentity } from './application-identity';

const navigationItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/routines', icon: Dumbbell, label: 'Routines' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/settings', icon: Settings, label: 'Settings' },
] as const;

type ApplicationShellProps = {
  children: ReactNode;
  identity: ApplicationIdentity;
  onExitGuest?: () => void;
};

export function ApplicationShell({
  children,
  identity,
  onExitGuest,
}: ApplicationShellProps) {
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
        <IdentitySummary
          className="border-t px-5 py-5"
          identity={identity}
          onExitGuest={onExitGuest}
        />
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
          <IdentitySummary
            className="ml-auto max-w-[180px]"
            compact
            identity={identity}
            onExitGuest={onExitGuest}
          />
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

type IdentitySummaryProps = {
  identity: ApplicationIdentity;
  className?: string;
  compact?: boolean;
  onExitGuest?: () => void;
};

function IdentitySummary({
  className,
  compact = false,
  identity,
  onExitGuest,
}: IdentitySummaryProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isGuest = identity.kind === 'guest';
  const label = isGuest
    ? 'Guest'
    : (identity.user.displayName ?? identity.user.email);
  const detail = isGuest ? 'Progress is temporary' : identity.user.email;
  const avatarUrl = isGuest ? null : identity.user.avatarUrl;

  const shouldShowGuestMenu =
    isMenuOpen && isGuest && onExitGuest !== undefined;

  return (
    <section
      aria-label="Current identity"
      className={cn('relative min-w-0', className)}
    >
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className={cn(
          'flex w-full min-w-0 items-center gap-3 rounded-md text-left',
          'transition-colors hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          compact ? 'p-1' : 'p-2',
        )}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        type="button"
      >
        {avatarUrl ? (
          <img
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
            src={avatarUrl}
          />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent">
            <UserRound aria-hidden="true" className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{label}</p>
          {!compact && (
            <p className="text-xs text-muted-foreground">{detail}</p>
          )}
        </div>
      </button>

      {shouldShowGuestMenu && (
        <div
          className={cn(
            'absolute z-40 min-w-44 rounded-md border bg-surface p-1 shadow-lg',
            compact
              ? 'right-0 top-full mt-2'
              : 'bottom-full left-0 mb-2 w-full',
          )}
          role="menu"
        >
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-primary',
              'transition-colors hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            onClick={onExitGuest}
            role="menuitem"
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
            <span>Exit guest</span>
          </button>
        </div>
      )}
    </section>
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
