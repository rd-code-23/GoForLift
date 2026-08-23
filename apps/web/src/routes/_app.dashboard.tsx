// Maps the dashboard URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

import { DashboardLanding } from '../features/dashboard/dashboard-landing';

export const Route = createFileRoute('/_app/dashboard')({
  component: DashboardLanding,
});
