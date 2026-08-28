/** Registers the protected exercise-picker route for routine creation. */
import { createFileRoute } from '@tanstack/react-router';

import { ExercisePicker } from '../features/routines/exercise-picker';

export const Route = createFileRoute('/_app/routines_/new_/exercises')({
  component: ExercisePicker,
});
