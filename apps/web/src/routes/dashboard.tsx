// Maps the dashboard route to the shared post-entry landing state.
import { createFileRoute } from '@tanstack/react-router';

import { DashboardLanding } from '../features/dashboard/dashboard-landing';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLanding,
});
