/** Verifies routine requests include credentials and validate backend responses. */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRoutine, fetchRoutines, RoutinesApiError } from './routines.api';

afterEach(() => vi.unstubAllGlobals());

describe('fetchRoutines', () => {
  it('fetches and validates the authenticated user routines', async () => {
    const response = {
      routines: [
        {
          id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          name: 'Upper Body',
          description: null,
          exerciseCount: 3,
          scheduledDays: [1, 3, 5],
          createdAt: '2026-08-26T10:00:00.000Z',
          updatedAt: '2026-08-26T10:00:00.000Z',
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(response));
    vi.stubGlobal('fetch', fetchMock);

    const abortController = new AbortController();

    await expect(fetchRoutines(abortController.signal)).resolves.toEqual(
      response,
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/routines', {
      credentials: 'include',
      signal: abortController.signal,
    });
  });

  it('rejects an unsuccessful response with its status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    await expect(fetchRoutines()).rejects.toEqual(new RoutinesApiError(500));
  });

  it('rejects a response that violates the shared contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(Response.json({ routines: [{ id: 'unsafe' }] })),
    );

    await expect(fetchRoutines()).rejects.toThrow();
  });
});

describe('createRoutine', () => {
  it('creates a routine with CSRF protection and validates the response', async () => {
    const response = {
      id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
      name: 'Upper Body',
      description: null,
      exerciseCount: 1,
      scheduledDays: [1],
      createdAt: '2026-08-26T10:00:00.000Z',
      updatedAt: '2026-08-26T10:00:00.000Z',
    };
    const input = {
      name: 'Upper Body',
      exercises: [
        {
          exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          position: 0,
          sets: 3,
          targetReps: 8,
          weight: 10,
          weightUnit: 'lb' as const,
          restBetweenSetsSeconds: 60,
          restAfterExerciseSeconds: 0,
          notes: null,
        },
      ],
      schedules: [{ dayOfWeek: 1, localTime: '18:00:00' }],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token-123' }))
      .mockResolvedValueOnce(Response.json(response, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createRoutine(input)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/auth/csrf-token', {
      credentials: 'include',
    });

    const requestInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/routines');
    expect(requestInit.credentials).toBe('include');
    expect(requestInit.method).toBe('POST');
    expect(new Headers(requestInit.headers).get('X-CSRF-Token')).toBe(
      'csrf-token-123',
    );
    expect(JSON.parse(requestInit.body as string)).toEqual(input);
  });
});
