/** Keeps routine draft form state mounted across the complete creation flow. */
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { RoutineDraftFormProvider } from '../../features/routines/routine-draft-form';

export const Route = createFileRoute('/_app/_routine-create')({
  component: RoutineCreationLayout,
});

function RoutineCreationLayout() {
  return (
    <RoutineDraftFormProvider>
      <Outlet />
    </RoutineDraftFormProvider>
  );
}
