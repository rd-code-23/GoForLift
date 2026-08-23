// Protects and frames every route inside the signed-in or guest application area.
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { ApplicationShell } from '../features/dashboard/application-shell';
import { DashboardAccessBoundary } from '../features/dashboard/dashboard-access-boundary';

export const Route = createFileRoute('/_app')({
  component: ProtectedApplicationLayout,
});

function ProtectedApplicationLayout() {
  return (
    <DashboardAccessBoundary>
      <ApplicationShell>
        <Outlet />
      </ApplicationShell>
    </DashboardAccessBoundary>
  );
}
