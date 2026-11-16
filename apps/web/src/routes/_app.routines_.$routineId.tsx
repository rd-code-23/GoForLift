/** Maps an individual routine URL into the authenticated application layout. */
import { createFileRoute } from '@tanstack/react-router';

import { RoutineDetails } from '@/features/routines/details/routine-details';

export const Route = createFileRoute('/_app/routines_/$routineId')({
  component: RoutineDetailsRoute,
});

function RoutineDetailsRoute() {
  const { routineId } = Route.useParams();
  return <RoutineDetails routineId={routineId} />;
}
