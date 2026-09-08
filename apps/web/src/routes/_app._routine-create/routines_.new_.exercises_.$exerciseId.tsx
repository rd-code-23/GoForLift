/** Registers exercise configuration inside the persistent routine form flow. */
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ExerciseConfiguration } from '../../features/routines/create/exercise-configuration/exercise-configuration';

export const Route = createFileRoute(
  '/_app/_routine-create/routines_/new_/exercises_/$exerciseId',
)({
  component: ExerciseConfigurationRoute,
  validateSearch: z.object({
    position: z.coerce.number().int().nonnegative().optional(),
  }),
});

function ExerciseConfigurationRoute() {
  const { exerciseId } = Route.useParams();
  const { position } = Route.useSearch();

  return (
    <ExerciseConfiguration exerciseId={exerciseId} editPosition={position} />
  );
}
