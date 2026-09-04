/** Groups the routine-creation pages without adding a public URL segment. */
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_routine-create')({
  component: RoutineCreationLayout,
});

function RoutineCreationLayout() {
  return <Outlet />;
}
