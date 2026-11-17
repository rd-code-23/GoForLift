/** Renders the reusable routine editor with saved values in edit mode. */
import { createFileRoute } from '@tanstack/react-router';

import { RoutineEditor } from '@/features/routines/create/editor/routine-editor';

export const Route = createFileRoute(
  '/_app/_routine-edit/routines_/$routineId/edit/',
)({
  component: EditRoutineEditor,
});

function EditRoutineEditor() {
  const { routineId } = Route.useParams();
  return <RoutineEditor mode="edit" routineId={routineId} />;
}
