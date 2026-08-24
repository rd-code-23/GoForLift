/** Verifies exercise-list contracts accept public data and reject malformed payloads. */
import { describe, expect, it } from 'vitest';

import {
  exerciseListResponseSchema,
  exerciseSummarySchema,
} from './exercise.contract.js';

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
});
