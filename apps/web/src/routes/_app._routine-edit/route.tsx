/** Groups routine-editing pages without adding a public URL segment. */
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/_routine-edit')({
  component: RoutineEditingLayout,
});

function RoutineEditingLayout() {
  return <Outlet />;
}
