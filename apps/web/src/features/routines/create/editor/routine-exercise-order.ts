import { arrayMove } from '@dnd-kit/helpers';

import type { RoutineDraftExerciseFormValues } from '../routine-draft-form';

export function reorderRoutineExercises(
  exercises: RoutineDraftExerciseFormValues[],
  fromIndex: number,
  toIndex: number,
) {
  return arrayMove(exercises, fromIndex, toIndex).map((exercise, position) => ({
    ...exercise,
    position,
  }));
}
