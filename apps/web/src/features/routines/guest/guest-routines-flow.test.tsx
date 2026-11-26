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
import { useGuestExercisesStore } from '@/features/exercises/guest-exercises.store';
import { createGuestRoutinesStore } from './guest-routines.store';

afterEach(() => {
  cleanup();
  clearGuestSession();
  createGuestRoutinesStore().persist.clearStorage();
  useGuestExercisesStore.setState({ exercises: [] });
  useGuestExercisesStore.persist.clearStorage();
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

it('manages guest routines and custom exercises with only catalog reads', async () => {
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
  expect(
    await screen.findByRole('link', { name: /Bench Press/ }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Create Custom Exercise' }),
  );
  await user.type(screen.getByLabelText('Exercise Name'), 'Custom Press');
  await user.type(screen.getByLabelText(/Description/), 'Use a narrow grip.');
  await user.click(screen.getByRole('button', { name: 'Create' }));
  await user.click(await screen.findByRole('link', { name: /Custom Press/ }));
  await user.click(await screen.findByRole('button', { name: 'Edit name' }));
  const exerciseName = screen.getByLabelText('Exercise Name');
  await user.clear(exerciseName);
  await user.type(exerciseName, 'Narrow Press');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    await screen.findByRole('heading', { name: 'Narrow Press' }),
  ).toBeVisible();
  await user.click(await screen.findByRole('button', { name: 'Done' }));
  await user.click(await screen.findByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('link', { name: /Push Day/ })).toBeVisible();
  expect(createGuestRoutinesStore().getState().routines[0]?.input.name).toBe(
    'Push Day',
  );
  firstVisit.unmount();

  expect(localStorage.getItem('goforlift-guest-exercises')).toContain(
    'Narrow Press',
  );
  const secondVisit = await renderGuestApp();
  await user.click(await screen.findByRole('link', { name: /Push Day/ }));
  const name = await screen.findByLabelText('Routine Name');
  expect(name).toHaveValue('Push Day');
  expect(screen.getByText('Narrow Press')).toBeVisible();
  await user.clear(name);
  await user.type(name, 'Upper Body');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await user.click(await screen.findByRole('link', { name: /Upper Body/ }));
  await user.click(await screen.findByRole('button', { name: 'Add Exercise' }));
  await user.click(await screen.findByRole('link', { name: /Narrow Press/ }));
  await user.click(
    await screen.findByRole('button', { name: 'Delete exercise' }),
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(
    await screen.findByText(/Remove this exercise from your saved routines/),
  ).toBeVisible();
  secondVisit.unmount();
  await renderGuestApp();
  await user.click(await screen.findByRole('link', { name: /Upper Body/ }));
  await user.click(
    await screen.findByRole('button', { name: 'Delete Routine' }),
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(
    await screen.findByRole('link', { name: 'Add Routine' }),
  ).toBeVisible();
  expect(createGuestRoutinesStore().getState().routines).toEqual([]);
  await user.click(screen.getByRole('link', { name: 'Add Routine' }));
  await user.click(await screen.findByRole('button', { name: 'Add Exercise' }));
  await user.click(await screen.findByRole('link', { name: /Narrow Press/ }));
  await user.click(
    await screen.findByRole('button', { name: 'Delete exercise' }),
  );
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  await screen.findByLabelText('Routine Name');
  expect(useGuestExercisesStore.getState().exercises).toEqual([]);
  expect(localStorage.getItem('goforlift-guest-exercises')).not.toContain(
    'Narrow Press',
  );
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/exercises',
    expect.objectContaining({
      credentials: 'omit',
    }),
  );
  expect(fetchMock.mock.calls.every(([url]) => url === '/api/exercises')).toBe(
    true,
  );
}, 15000);
