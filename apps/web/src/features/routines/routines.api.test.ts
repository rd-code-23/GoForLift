/** Verifies routine requests include credentials and validate backend responses. */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRoutines, RoutinesApiError } from './routines.api';

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
