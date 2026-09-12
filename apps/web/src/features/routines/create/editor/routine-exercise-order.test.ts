import { describe, expect, it } from 'vitest';

import type { RoutineDraftExerciseFormValues } from '../routine-draft-form';
import { reorderRoutineExercises } from './routine-exercise-order';

const exercises: RoutineDraftExerciseFormValues[] = [
  {
    draftExerciseId: '06d34dc0-8e4c-4bd0-9e3b-7b839b44e481',
    exerciseId: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e481',
    name: 'Bicep Curl',
    notes: null,
    position: 0,
    restAfterExerciseSeconds: 0,
    restBetweenSetsSeconds: 60,
    sets: 3,
    targetReps: 8,
    weight: 10,
    weightUnit: 'lb',
  },
  {
    draftExerciseId: '06d34dc0-8e4c-4bd0-9e3b-7b839b44e482',
    exerciseId: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e482',
    name: 'Lateral Raise',
    notes: null,
    position: 1,
    restAfterExerciseSeconds: 0,
    restBetweenSetsSeconds: 60,
    sets: 3,
    targetReps: 8,
    weight: 10,
    weightUnit: 'lb',
  },
  {
    draftExerciseId: '06d34dc0-8e4c-4bd0-9e3b-7b839b44e483',
    exerciseId: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e483',
    name: 'Shoulder Press',
    notes: null,
    position: 2,
    restAfterExerciseSeconds: 0,
    restBetweenSetsSeconds: 60,
    sets: 3,
    targetReps: 8,
    weight: 10,
    weightUnit: 'lb',
  },
];

describe('reorderRoutineExercises', () => {
  it('moves an exercise and rewrites sequential positions', () => {
    const reorderedExercises = reorderRoutineExercises(exercises, 2, 0);

    expect(
      reorderedExercises.map(({ name, position }) => ({ name, position })),
    ).toEqual([
      { name: 'Shoulder Press', position: 0 },
      { name: 'Bicep Curl', position: 1 },
      { name: 'Lateral Raise', position: 2 },
    ]);
  });
});
