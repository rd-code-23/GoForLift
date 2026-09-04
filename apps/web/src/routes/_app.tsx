// Protects and frames every route inside the signed-in or guest application area.
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';

import { ApplicationAccessBoundary } from '../app/application-access-boundary';
import { ApplicationIdentityContext } from '../app/application-identity';
import { ApplicationShell } from '../app/application-shell';
import { clearGuestSession } from '../features/auth/guest-session';
import { useLogoutMutation } from '../features/auth/logout.mutation';
import { RoutineDraftFormProvider } from '../features/routines/create/routine-draft-form';

export const Route = createFileRoute('/_app')({
  component: ProtectedApplicationLayout,
});

function ProtectedApplicationLayout() {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  function exitGuest() {
    clearGuestSession();
    void navigate({ to: '/', replace: true });
  }

  function logoutUser() {
    logoutMutation.mutate();
  }

  return (
    <ApplicationAccessBoundary>
      {(identity) => (
        <ApplicationIdentityContext.Provider value={identity}>
          <RoutineDraftFormProvider>
            <ApplicationShell
              identity={identity}
              onExitGuest={identity.kind === 'guest' ? exitGuest : undefined}
              onLogout={identity.kind === 'user' ? logoutUser : undefined}
            >
              <Outlet />
            </ApplicationShell>
          </RoutineDraftFormProvider>
        </ApplicationIdentityContext.Provider>
      )}
    </ApplicationAccessBoundary>
  );
}
