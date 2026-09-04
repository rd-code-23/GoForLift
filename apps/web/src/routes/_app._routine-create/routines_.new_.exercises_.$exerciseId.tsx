/** Registers exercise configuration inside the persistent routine form flow. */
import { createFileRoute } from '@tanstack/react-router';

import { ExerciseConfiguration } from '../../features/routines/create/exercise-configuration/exercise-configuration';

export const Route = createFileRoute(
  '/_app/_routine-create/routines_/new_/exercises_/$exerciseId',
)({
  component: ExerciseConfigurationRoute,
});

function ExerciseConfigurationRoute() {
  const { exerciseId } = Route.useParams();

  return <ExerciseConfiguration exerciseId={exerciseId} />;
}
