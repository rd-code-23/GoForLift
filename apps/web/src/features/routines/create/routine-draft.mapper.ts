/** Converts UI-only routine draft data into the strict create-routine contract. */
import {
  createRoutineExerciseInputSchema,
  createRoutineInputSchema,
  type CreateRoutineInput,
  type RoutineDetail,
} from '@goforlift/contracts';

import type {
  ParsedRoutineDraftFormValues,
  RoutineDraftFormValues,
} from './routine-draft-form';

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

export function toRoutineDraftFormValues(
  routine: RoutineDetail,
): RoutineDraftFormValues {
  return {
    description: routine.description,
    name: routine.name,
    exercises: routine.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      position: exercise.position,
      sets: exercise.sets,
      targetReps: exercise.targetReps,
      weight: exercise.weight,
      weightUnit: exercise.weightUnit,
      restBetweenSetsSeconds: exercise.restBetweenSetsSeconds,
      restAfterExerciseSeconds: exercise.restAfterExerciseSeconds,
      notes: exercise.notes,
      draftExerciseId: crypto.randomUUID(),
    })),
    schedules: routine.schedules,
  };
}
