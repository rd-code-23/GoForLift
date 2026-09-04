/** Verifies the routine page's registered-user and guest-facing states. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApplicationIdentityContext } from '@/app/application-identity';
import { createPublicUser } from '@/test/fixtures/public-user.fixture';
import { RoutinesLanding } from './routines-landing';

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
    const testRouter = createRouter({
      history: createMemoryHistory({ initialEntries: ['/'] }),
      routeTree: rootRoute,
    });

    return (
      <QueryClientProvider client={queryClient}>
        <ApplicationIdentityContext.Provider value={identityValue}>
          <RouterProvider router={testRouter} />
        </ApplicationIdentityContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe('routines landing', () => {
  it('shows a localized loading state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    render(<RoutinesLanding />, { wrapper: createWrapper() });

    expect(await screen.findByLabelText('Loading routines')).toBeVisible();
  });

  it('shows only the add-routine action for an empty routine list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ routines: [] })),
    );

    render(<RoutinesLanding />, { wrapper: createWrapper() });

    expect(
      await screen.findByRole('link', { name: 'Add Routine' }),
    ).toBeVisible();

    expect(screen.queryByText('No routines yet.')).not.toBeInTheDocument();
  });

  it('shows routine summaries returned by the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          routines: [
            {
              id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
              name: 'Upper Body',
              description: 'Monday strength session',
              exerciseCount: 3,
              scheduledDays: [1, 3, 5],
              createdAt: '2026-08-26T10:00:00.000Z',
              updatedAt: '2026-08-26T10:00:00.000Z',
            },
          ],
        }),
      ),
    );

    render(<RoutinesLanding />, { wrapper: createWrapper() });

    expect(
      await screen.findByRole('heading', { name: 'Upper Body' }),
    ).toBeVisible();
    expect(screen.getByText('3 exercises')).toBeVisible();
    expect(screen.getByText('Mon, Wed, Fri')).toBeVisible();
  });

  it('shows a retry action after an API failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ routines: [] }));
    vi.stubGlobal('fetch', fetchMock);

    render(<RoutinesLanding />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole('link', { name: 'Add Routine' }),
    ).toBeVisible();
  });

  it('does not request persistent routines for a guest', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<RoutinesLanding />, { wrapper: createWrapper('guest') });

    expect(
      await screen.findByText('Guest routines are coming later.'),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
