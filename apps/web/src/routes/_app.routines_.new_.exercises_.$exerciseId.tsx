/** Registers the selected-exercise configuration route. */
import { createFileRoute } from '@tanstack/react-router';

import { ExerciseConfiguration } from '../features/routines/exercise-configuration';

export const Route = createFileRoute(
  '/_app/routines_/new_/exercises_/$exerciseId',
)({
  component: ExerciseConfigurationRoute,
});

function ExerciseConfigurationRoute() {
  const { exerciseId } = Route.useParams();

  return <ExerciseConfiguration exerciseId={exerciseId} />;
}
