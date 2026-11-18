/** Configures an exercise while preserving the routine edit form. */
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ExerciseConfiguration } from '@/features/routines/create/exercise-configuration/exercise-configuration';

export const Route = createFileRoute(
  '/_app/_routine-edit/routines_/$routineId/edit/exercises_/$exerciseId',
)({
  component: EditRoutineExerciseConfiguration,
  validateSearch: z.object({
    position: z.coerce.number().int().nonnegative().optional(),
  }),
});

function EditRoutineExerciseConfiguration() {
  const { exerciseId, routineId } = Route.useParams();
  const { position } = Route.useSearch();

  return (
    <ExerciseConfiguration
      editPosition={position}
      exerciseId={exerciseId}
      mode="edit"
      routineId={routineId}
    />
  );
}
