/** Verifies exercise loading and client-side search in the routine picker. */
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
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ExercisePicker } from './exercise-picker';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => children });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/'] }),
    routeTree: rootRoute,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

it('filters available exercises by name', async () => {
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
          {
            id: '43805735-8ee9-4cbd-9da1-c7ec5965cb03',
            name: 'Shoulder Press',
            description: null,
            isCustom: false,
          },
        ],
      }),
    ),
  );

  render(<ExercisePicker />, { wrapper: Wrapper });

  expect(await screen.findByText('Bicep Curl')).toBeVisible();
  expect(screen.getByText('Shoulder Press')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Bicep Curl' })).toHaveAttribute(
    'href',
    '/routines/new/exercises/26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
  );

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search exercises' }),
    {
      target: { value: 'shoulder' },
    },
  );

  expect(screen.queryByText('Bicep Curl')).not.toBeInTheDocument();
  expect(screen.getByText('Shoulder Press')).toBeVisible();
});

it('opens the custom exercise form and validates its required name', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ exercises: [] })),
  );

  render(<ExercisePicker />, { wrapper: Wrapper });

  await user.click(
    await screen.findByRole('button', { name: 'Create Custom Exercise' }),
  );
  expect(
    screen.getByRole('heading', { name: 'Create Custom Exercise' }),
  ).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Create' }));

  expect(screen.getByLabelText('Exercise Name')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(screen.getByText('Enter an exercise name.')).toBeVisible();
});

it('shows a custom-exercise request error and clears it after a successful retry', async () => {
  const user = userEvent.setup();
  const exerciseId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  let createAttempts = 0;

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (input === '/auth/csrf-token') {
        return Promise.resolve(Response.json({ csrfToken: 'csrf-token' }));
      }

      if (input === '/api/exercises' && init?.method === 'POST') {
        createAttempts += 1;

        if (createAttempts === 1) {
          return Promise.resolve(
            Response.json({ error: 'internal_server_error' }, { status: 500 }),
          );
        }

        return Promise.resolve(
          Response.json({
            id: exerciseId,
            name: 'Cable Pullover',
            description: null,
            isCustom: true,
          }),
        );
      }

      return Promise.resolve(Response.json({ exercises: [] }));
    }),
  );

  render(<ExercisePicker />, { wrapper: Wrapper });

  await user.click(
    await screen.findByRole('button', { name: 'Create Custom Exercise' }),
  );
  await user.type(screen.getByLabelText('Exercise Name'), 'Cable Pullover');
  await user.click(screen.getByRole('button', { name: 'Create' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    "We couldn't create your custom exercise. Try again.",
  );

  await user.click(screen.getByRole('button', { name: 'Create' }));

  await waitFor(() => expect(createAttempts).toBe(2));
  expect(
    screen.queryByText("We couldn't create your custom exercise. Try again."),
  ).toBeNull();
});
