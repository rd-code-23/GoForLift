import { describe, expect, it } from 'vitest';

import { toCreateRoutineInput } from './routine-draft.mapper';

describe('toCreateRoutineInput', () => {
  it('removes the UI-only exercise name from the API request', () => {
    const input = toCreateRoutineInput({
      name: 'Upper Body',
      exercises: [
        {
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
    expect(input.exercises[0]).not.toHaveProperty('name');
  });
});
