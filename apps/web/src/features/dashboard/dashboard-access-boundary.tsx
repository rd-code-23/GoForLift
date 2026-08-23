// Allows authenticated and guest visitors into application routes while handling unresolved access.
import type { PublicUser } from '@goforlift/contracts';
import { Navigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Button } from '../../components/ui/button';
import { useCurrentUser } from '../auth/current-user.query';
import { isGuestSession } from '../auth/guest-session';

export type ApplicationIdentity =
  { kind: 'guest' } | { kind: 'user'; user: PublicUser };

type DashboardAccessBoundaryProps = {
  children: (identity: ApplicationIdentity) => ReactNode;
};

export function DashboardAccessBoundary({
  children,
}: DashboardAccessBoundaryProps) {
  const currentUser = useCurrentUser();

  if (isGuestSession()) {
    return children({ kind: 'guest' });
  }

  if (currentUser.authenticationStatus === 'loading') {
    return <AccessStatus message="Checking your session…" />;
  }

  if (currentUser.authenticationStatus === 'error') {
    return (
      <AccessStatus message="We couldn't verify your session.">
        <Button onClick={() => void currentUser.refetch()} type="button">
          Try again
        </Button>
      </AccessStatus>
    );
  }

  if (currentUser.authenticationStatus === 'anonymous') {
    return <Navigate replace to="/" />;
  }

  return children({ kind: 'user', user: currentUser.user });
}

function AccessStatus({
  children,
  message,
}: {
  children?: ReactNode;
  message: string;
}) {
  return (
    <main className="grid min-h-screen place-content-center gap-4 bg-background px-6 text-center text-foreground">
      <p aria-live="polite" className="text-muted-foreground">
        {message}
      </p>
      {children}
    </main>
  );
}
