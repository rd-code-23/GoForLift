/** Opens the exercise picker while preserving the routine edit form. */
import { createFileRoute } from '@tanstack/react-router';

import { ExercisePicker } from '@/features/routines/create/exercise-picker/exercise-picker';

export const Route = createFileRoute(
  '/_app/_routine-edit/routines_/$routineId/edit/exercises',
)({
  component: EditRoutineExercisePicker,
});

function EditRoutineExercisePicker() {
  const { routineId } = Route.useParams();
  return <ExercisePicker mode="edit" routineId={routineId} />;
}
