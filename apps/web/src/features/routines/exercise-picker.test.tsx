/** Verifies exercise loading and client-side search in the routine picker. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  fireEvent.change(
    screen.getByRole('searchbox', { name: 'Search exercises' }),
    {
      target: { value: 'shoulder' },
    },
  );

  expect(screen.queryByText('Bicep Curl')).not.toBeInTheDocument();
  expect(screen.getByText('Shoulder Press')).toBeVisible();
});
