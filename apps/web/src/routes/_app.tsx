// Protects and frames every route inside the signed-in or guest application area.
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';

import { ApplicationAccessBoundary } from '../app/application-access-boundary';
import { ApplicationIdentityContext } from '../app/application-identity';
import { ApplicationShell } from '../app/application-shell';
import { clearGuestSession } from '../features/auth/guest-session';

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
    <ApplicationAccessBoundary>
      {(identity) => (
        <ApplicationIdentityContext.Provider value={identity}>
          <ApplicationShell
            identity={identity}
            onExitGuest={identity.kind === 'guest' ? exitGuest : undefined}
          >
            <Outlet />
          </ApplicationShell>
        </ApplicationIdentityContext.Provider>
      )}
    </ApplicationAccessBoundary>
  );
}
