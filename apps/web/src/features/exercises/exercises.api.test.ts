/** Verifies exercise API status and shared-contract handling. */
import { afterEach, expect, it, vi } from 'vitest';

import { ExercisesApiError, fetchExercises } from './exercises.api';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('returns exercises that satisfy the shared contract', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        exercises: [
          {
            id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
            name: 'Bicep Curl',
            description: null,
            isCustom: false,
          },
        ],
      }),
    ),
  );

  await expect(fetchExercises()).resolves.toEqual({
    exercises: [
      {
        id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
        name: 'Bicep Curl',
        description: null,
        isCustom: false,
      },
    ],
  });
});

it('throws a typed error when the request fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
  );

  await expect(fetchExercises()).rejects.toEqual(new ExercisesApiError(500));
});
