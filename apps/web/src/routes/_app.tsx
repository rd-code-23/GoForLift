// Protects and frames every route inside the signed-in or guest application area.
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';

import { clearGuestSession } from '../features/auth/guest-session';
import { ApplicationShell } from '../features/dashboard/application-shell';
import { DashboardAccessBoundary } from '../features/dashboard/dashboard-access-boundary';

export const Route = createFileRoute('/_app')({
  component: ProtectedApplicationLayout,
});

function ProtectedApplicationLayout() {
  const navigate = useNavigate();

  function exitGuest() {
    clearGuestSession();
    void navigate({ to: '/', replace: true });
  }

  return (
    <DashboardAccessBoundary>
      {(identity) => (
        <ApplicationShell
          identity={identity}
          onExitGuest={identity.kind === 'guest' ? exitGuest : undefined}
        >
          <Outlet />
        </ApplicationShell>
      )}
    </DashboardAccessBoundary>
  );
}
