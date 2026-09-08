/** Converts UI-only routine draft data into the strict create-routine contract. */
import {
  createRoutineExerciseInputSchema,
  createRoutineInputSchema,
  type CreateRoutineInput,
} from '@goforlift/contracts';

import type { ParsedRoutineDraftFormValues } from './routine-draft-form';

export function toCreateRoutineInput(
  draft: ParsedRoutineDraftFormValues,
): CreateRoutineInput {
  return createRoutineInputSchema.parse({
    ...draft,
    exercises: draft.exercises.map((exercise) =>
      createRoutineExerciseInputSchema.strip().parse(exercise),
    ),
  });
}
