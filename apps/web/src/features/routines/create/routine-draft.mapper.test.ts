import { describe, expect, it } from 'vitest';

import {
  toCreateRoutineInput,
  toRoutineDraftFormValues,
} from './routine-draft.mapper';

describe('toCreateRoutineInput', () => {
  it('removes UI-only exercise fields from the API request', () => {
    const input = toCreateRoutineInput({
      name: 'Upper Body',
      exercises: [
        {
          draftExerciseId: '06d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
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
  });
});

describe('toRoutineDraftFormValues', () => {
  it('prefills every persisted routine field and adds UI-only row ids', () => {
    const draft = toRoutineDraftFormValues({
      id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
      name: 'Upper Body',
      description: 'Monday training plan',
      exercises: [
        {
          exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          name: 'Bench Press',
          description: null,
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
      schedules: [{ dayOfWeek: 1, localTime: '18:00:00' }],
      createdAt: '2026-08-26T10:00:00.000Z',
      updatedAt: '2026-08-26T10:00:00.000Z',
    });

    expect(typeof draft.exercises[0]?.draftExerciseId).toBe('string');
    expect(draft).toMatchObject({
      name: 'Upper Body',
      description: 'Monday training plan',
      exercises: [
        {
          exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          position: 0,
        },
      ],
      schedules: [{ dayOfWeek: 1, localTime: '18:00:00' }],
    });
  });
});
