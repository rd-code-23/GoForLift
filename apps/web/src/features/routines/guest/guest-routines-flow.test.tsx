/** Verifies guest routine actions through the app routes and browser storage. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import {
  clearGuestSession,
  startGuestSession,
} from '@/features/auth/guest-session';
import { routeTree } from '@/routeTree.gen';
import { createGuestRoutinesStore } from './guest-routines.store';

afterEach(() => {
  cleanup();
  clearGuestSession();
  createGuestRoutinesStore().persist.clearStorage();
  vi.unstubAllGlobals();
});

async function renderGuestApp() {
  const queryClient = new QueryClient();
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/routines'] }),
    routeTree,
  });

  await router.load();

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

it('creates, reopens, edits, and deletes a guest routine with only catalog reads', async () => {
  startGuestSession();
  const fetchMock = vi.fn((url: string) => {
    if (url !== '/api/exercises')
      throw new Error(`Unexpected request to ${url}`);
    return Promise.resolve(
      Response.json({
        exercises: [
          {
            id: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
            name: 'Bench Press',
            description: null,
            isCustom: false,
          },
        ],
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);

  const user = userEvent.setup();
  const firstVisit = await renderGuestApp();
  await user.click(await screen.findByRole('link', { name: 'Add Routine' }));
  await user.type(await screen.findByLabelText('Routine Name'), 'Push Day');
  await user.click(screen.getByRole('button', { name: 'Add Exercise' }));
  const benchPress = await screen.findByRole('link', { name: /Bench Press/ });
  expect(
    screen.queryByRole('button', { name: 'Create Custom Exercise' }),
  ).toBeNull();
  await user.click(benchPress);
  await user.click(await screen.findByRole('button', { name: 'Done' }));
  await user.click(await screen.findByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('link', { name: /Push Day/ })).toBeVisible();
  expect(createGuestRoutinesStore().getState().routines[0]?.input.name).toBe(
    'Push Day',
  );
  firstVisit.unmount();

  await renderGuestApp();
  await user.click(await screen.findByRole('link', { name: /Push Day/ }));
  const name = await screen.findByLabelText('Routine Name');
  expect(name).toHaveValue('Push Day');
  expect(screen.getByText('Bench Press')).toBeVisible();
  await user.clear(name);
  await user.type(name, 'Upper Body');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await user.click(await screen.findByRole('link', { name: /Upper Body/ }));
  await user.click(
    await screen.findByRole('button', { name: 'Delete Routine' }),
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(
    await screen.findByRole('link', { name: 'Add Routine' }),
  ).toBeVisible();
  expect(createGuestRoutinesStore().getState().routines).toEqual([]);
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/exercises',
    expect.objectContaining({
      credentials: 'omit',
    }),
  );
  expect(fetchMock.mock.calls.every(([url]) => url === '/api/exercises')).toBe(
    true,
  );
});
