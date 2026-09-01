/** Verifies routine-list contracts accept public data and reject malformed payloads. */
import { describe, expect, it } from 'vitest';

import {
  createRoutineExerciseInputSchema,
  createRoutineInputSchema,
  ROUTINE_NAME_MAX_LENGTH,
  routineListResponseSchema,
  routineNameSchema,
  routineSummarySchema,
} from './routine.contract.js';

const validCreateRoutineInput = {
  name: '  Upper Body  ',
  description: '  Monday training plan.  ',
  exercises: [
    {
      exerciseId: '9f4b5a8e-2c3d-4f10-8a11-000000000001',
      position: 0,
      sets: 3,
      targetReps: 10,
      weight: 25,
      weightUnit: 'lb' as const,
    },
  ],
  schedules: [{ dayOfWeek: 1, localTime: '18:30:00' }],
};

describe('routineNameSchema', () => {
  it('normalizes valid names and rejects empty names', () => {
    expect(routineNameSchema.parse('  Upper Body  ')).toBe('Upper Body');
    expect(() => routineNameSchema.parse('   ')).toThrow();
  });

  it('returns a clear maximum-length message', () => {
    const result = routineNameSchema.safeParse(
      'x'.repeat(ROUTINE_NAME_MAX_LENGTH + 1),
    );

    expect(result.error?.issues[0]?.message).toBe(
      `Maximum length is ${ROUTINE_NAME_MAX_LENGTH} characters`,
    );
  });
});

describe('createRoutineInputSchema', () => {
  it('normalizes a valid routine and applies exercise defaults', () => {
    expect(createRoutineInputSchema.parse(validCreateRoutineInput)).toEqual({
      ...validCreateRoutineInput,
      name: 'Upper Body',
      description: 'Monday training plan.',
      exercises: [
        {
          ...validCreateRoutineInput.exercises[0],
          restBetweenSetsSeconds: 60,
          restAfterExerciseSeconds: 0,
          notes: null,
        },
      ],
    });
  });

  it('provides shared defaults for a newly selected exercise', () => {
    const exercise = createRoutineExerciseInputSchema.parse({
      exerciseId: '9f4b5a8e-2c3d-4f10-8a11-000000000001',
      position: 0,
    });

    expect(exercise).toEqual({
      exerciseId: '9f4b5a8e-2c3d-4f10-8a11-000000000001',
      position: 0,
      sets: 3,
      targetReps: 8,
      weight: 10,
      weightUnit: 'lb',
      restBetweenSetsSeconds: 60,
      restAfterExerciseSeconds: 0,
      notes: null,
    });
  });

  it('rejects invalid exercise configuration and schedules', () => {
    expect(() =>
      createRoutineInputSchema.parse({
        ...validCreateRoutineInput,
        exercises: [],
      }),
    ).toThrow();
    expect(() =>
      createRoutineInputSchema.parse({
        ...validCreateRoutineInput,
        exercises: [
          {
            ...validCreateRoutineInput.exercises[0],
            sets: 0,
            weightUnit: 'stone',
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      createRoutineInputSchema.parse({
        ...validCreateRoutineInput,
        schedules: [{ dayOfWeek: 7, localTime: '25:00:00' }],
      }),
    ).toThrow();
  });

  it('rejects duplicate positions, schedules, and client-controlled fields', () => {
    expect(() =>
      createRoutineInputSchema.parse({
        ...validCreateRoutineInput,
        exercises: [
          validCreateRoutineInput.exercises[0],
          {
            ...validCreateRoutineInput.exercises[0],
            exerciseId: '9f4b5a8e-2c3d-4f10-8a11-000000000002',
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      createRoutineInputSchema.parse({
        ...validCreateRoutineInput,
        schedules: [
          validCreateRoutineInput.schedules[0],
          validCreateRoutineInput.schedules[0],
        ],
      }),
    ).toThrow();
    expect(() =>
      createRoutineInputSchema.parse({
        ...validCreateRoutineInput,
        userId: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
      }),
    ).toThrow();
  });
});

const routineSummary = {
  id: 'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
  name: 'Upper Body',
  description: null,
  exerciseCount: 3,
  scheduledDays: [1, 3, 5],
  createdAt: '2026-08-24T18:00:00.000Z',
  updatedAt: '2026-08-24T19:00:00.000Z',
};

describe('routine contracts', () => {
  it('accepts populated and empty routine lists', () => {
    expect(
      routineListResponseSchema.safeParse({ routines: [routineSummary] })
        .success,
    ).toBe(true);
    expect(routineListResponseSchema.safeParse({ routines: [] }).success).toBe(
      true,
    );
  });

  it('rejects malformed routine summaries', () => {
    expect(
      routineSummarySchema.safeParse({
        ...routineSummary,
        exerciseCount: -1,
      }).success,
    ).toBe(false);
    expect(
      routineSummarySchema.safeParse({
        ...routineSummary,
        scheduledDays: [7],
      }).success,
    ).toBe(false);
    expect(
      routineSummarySchema.safeParse({
        ...routineSummary,
        createdAt: 'not-a-date',
      }).success,
    ).toBe(false);
  });
});
