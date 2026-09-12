import { describe, expect, it } from 'vitest';

import { toCreateRoutineInput } from './routine-draft.mapper';

describe('toCreateRoutineInput', () => {
  it('removes UI-only exercise fields from the API request', () => {
    const input = toCreateRoutineInput({
      name: 'Upper Body',
      exercises: [
        {
          draftExerciseId: '06d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          name: 'Bicep Curl',
          position: 0,
          sets: 3,
          targetReps: 8,
          weight: 10,
          weightUnit: 'lb',
          restBetweenSetsSeconds: 60,
          restAfterExerciseSeconds: 0,
          notes: null,
        },
      ],
      schedules: [],
    });

    expect(input.exercises[0]).toEqual({
      exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
      position: 0,
      sets: 3,
      targetReps: 8,
      weight: 10,
      weightUnit: 'lb',
      restBetweenSetsSeconds: 60,
      restAfterExerciseSeconds: 0,
      notes: null,
    });
    expect(input.exercises[0]).not.toHaveProperty('draftExerciseId');
    expect(input.exercises[0]).not.toHaveProperty('name');
  });
});
