/** Verifies routine detail loading, success, not-found, and guest states. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApplicationIdentityContext } from '@/app/application-identity';
import { createPublicUser } from '@/test/fixtures/public-user.fixture';
import { RoutineDetails } from './routine-details';

const routineId = 'c38794ef-9a4a-40d8-8cdc-7f7416a53120';

const routineDetail = {
  id: routineId,
  name: 'Upper Body',
  description: 'Monday strength session',
  exercises: [
    {
      exerciseId: '9f4b5a8e-2c3d-4f10-8a11-000000000001',
      name: 'Bench Press',
      description: 'Press from the chest.',
      position: 0,
      sets: 3,
      targetReps: 10,
      weight: 25,
      weightUnit: 'lb',
      restBetweenSetsSeconds: 60,
      restAfterExerciseSeconds: 0,
      notes: 'Keep shoulders down.',
    },
  ],
  schedules: [{ dayOfWeek: 1, localTime: '18:30:00' }],
  createdAt: '2026-08-24T18:00:00.000Z',
  updatedAt: '2026-08-24T19:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function createWrapper(identity: 'guest' | 'user' = 'user') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const identityValue =
    identity === 'guest'
      ? ({ kind: 'guest' } as const)
      : ({ kind: 'user', user: createPublicUser() } as const);

  return function Wrapper({ children }: PropsWithChildren) {
    const rootRoute = createRootRoute({ component: () => children });
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: ['/routines/test'] }),
      routeTree: rootRoute,
    });

    return (
      <QueryClientProvider client={queryClient}>
        <ApplicationIdentityContext.Provider value={identityValue}>
          <RouterProvider router={router} />
        </ApplicationIdentityContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe('routine details', () => {
  it('shows the saved routine configuration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json(routineDetail)),
    );

    render(<RoutineDetails routineId={routineId} />, {
      wrapper: createWrapper(),
    });

    expect(
      await screen.findByRole('heading', { name: 'Upper Body' }),
    ).toBeVisible();
    expect(screen.getByText('Bench Press')).toBeVisible();
    expect(screen.getByText('Monday')).toBeVisible();
    expect(screen.getByText('6:30 PM')).toBeVisible();
    expect(screen.getByText('25 lb')).toBeVisible();
  });

  it('requires confirmation before deleting the routine', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(routineDetail))
      .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token-123' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<RoutineDetails routineId={routineId} />, {
      wrapper: createWrapper(),
    });

    await user.click(
      await screen.findByRole('button', { name: 'Delete Routine' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Delete Routine?' }),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[0]).toBe(`/api/routines/${routineId}`);
    expect(
      screen.queryByRole('heading', { name: 'Delete Routine?' }),
    ).not.toBeInTheDocument();
  });

  it('shows a not-found state for an unavailable routine', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: 'routine_not_found' }, { status: 404 }),
        ),
    );

    render(<RoutineDetails routineId={routineId} />, {
      wrapper: createWrapper(),
    });

    expect(
      await screen.findByText("We couldn't find that routine."),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument();
  });

  it('does not request a persisted routine for a guest', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<RoutineDetails routineId={routineId} />, {
      wrapper: createWrapper('guest'),
    });

    expect(
      await screen.findByText('Sign in to view saved routines.'),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
