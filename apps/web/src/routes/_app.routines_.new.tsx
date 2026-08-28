// Maps the routine-creation URL into the protected application layout.
import { createFileRoute } from '@tanstack/react-router';

import { RoutineEditor } from '../features/routines/routine-editor';

export const Route = createFileRoute('/_app/routines_/new')({
  component: RoutineEditor,
});
