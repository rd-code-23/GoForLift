/** Verifies exercise-list contracts accept public data and reject malformed payloads. */
import { describe, expect, it } from 'vitest';

import {
  createExerciseInputSchema,
  EXERCISE_NAME_MAX_LENGTH,
  exerciseListResponseSchema,
  exerciseSummarySchema,
} from './exercise.contract.js';

describe('createExerciseInputSchema', () => {
  it('trims and accepts a valid custom exercise', () => {
    expect(
      createExerciseInputSchema.parse({
        name: '  Cable Fly  ',
        description: '  Keep the movement controlled.  ',
      }),
    ).toEqual({
      name: 'Cable Fly',
      description: 'Keep the movement controlled.',
    });
  });

  it('rejects empty, oversized, and client-controlled fields', () => {
    expect(() => createExerciseInputSchema.parse({ name: '   ' })).toThrow();
    expect(() =>
      createExerciseInputSchema.parse({
        name: 'a'.repeat(EXERCISE_NAME_MAX_LENGTH + 1),
      }),
    ).toThrow();
    expect(() =>
      createExerciseInputSchema.parse({
        name: 'Cable Fly',
        ownerUserId: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
      }),
    ).toThrow();
  });
});

describe('exercise contracts', () => {
  it('accepts built-in and custom exercise summaries', () => {
    const result = exerciseListResponseSchema.safeParse({
      exercises: [
        {
          id: '9f4b5a8e-2c3d-4f10-8a11-000000000001',
          name: 'Bicep Curl',
          description: null,
          isCustom: false,
        },
        {
          id: '0d10f788-a39b-4f97-9927-5b28fec83aef',
          name: 'My Custom Press',
          description: 'A custom pressing movement.',
          isCustom: true,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects malformed exercise summaries', () => {
    const result = exerciseSummarySchema.safeParse({
      id: 'not-a-uuid',
      name: '',
      description: null,
      isCustom: 'yes',
    });

    expect(result.success).toBe(false);
  });

  it('rejects exercise names that exceed the product limit', () => {
    expect(() =>
      exerciseSummarySchema.parse({
        id: 'bde77251-e433-4f39-b1cb-41a2f2ad5462',
        name: 'a'.repeat(EXERCISE_NAME_MAX_LENGTH + 1),
        description: null,
        isCustom: false,
      }),
    ).toThrow();
  });
});
