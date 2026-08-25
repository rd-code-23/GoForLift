/** Verifies routine-list contracts accept public data and reject malformed payloads. */
import { describe, expect, it } from 'vitest';

import {
  routineListResponseSchema,
  routineSummarySchema,
} from './routine.contract.js';

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
