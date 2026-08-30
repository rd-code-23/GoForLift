// Maps the routine-creation URL into the persistent routine form layout.
import { createFileRoute } from '@tanstack/react-router';

import { RoutineEditor } from '../../features/routines/create/editor/routine-editor';

export const Route = createFileRoute('/_app/_routine-create/routines_/new')({
  component: RoutineEditor,
});
