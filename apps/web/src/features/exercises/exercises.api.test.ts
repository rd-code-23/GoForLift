/** Verifies exercise API status and shared-contract handling. */
import { afterEach, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api-error';

import {
  createExercise,
  fetchExercises,
  updateExerciseName,
} from './exercises.api';

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

  await expect(fetchExercises()).rejects.toEqual(new ApiError(500));
});

it('creates and validates a custom exercise', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token' }))
    .mockResolvedValueOnce(
      Response.json(
        {
          id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          name: 'Cable Pullover',
          description: 'Keep the arms straight.',
          isCustom: true,
        },
        { status: 201 },
      ),
    );
  vi.stubGlobal('fetch', fetchMock);

  await expect(
    createExercise({
      description: 'Keep the arms straight.',
      name: 'Cable Pullover',
    }),
  ).resolves.toMatchObject({
    name: 'Cable Pullover',
    isCustom: true,
  });

  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/exercises',
    expect.objectContaining({ method: 'POST' }),
  );
});

it('updates a custom exercise name', async () => {
  const exerciseId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token' }))
    .mockResolvedValueOnce(
      Response.json({
        id: exerciseId,
        name: 'Renamed Pullover',
        description: null,
        isCustom: true,
      }),
    );
  vi.stubGlobal('fetch', fetchMock);

  await expect(
    updateExerciseName({
      exerciseId,
      input: { name: 'Renamed Pullover' },
    }),
  ).resolves.toMatchObject({ name: 'Renamed Pullover' });

  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    `/api/exercises/${exerciseId}`,
    expect.objectContaining({ method: 'PATCH' }),
  );
});
