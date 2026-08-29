/** Verifies selected exercise data is shown in the configuration shell. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { ExerciseConfiguration } from './exercise-configuration';

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

it('shows the selected exercise and initial configuration fields', async () => {
  const exerciseId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        exercises: [
          {
            id: exerciseId,
            name: 'Bicep Curl',
            description: null,
            isCustom: false,
          },
        ],
      }),
    ),
  );

  render(<ExerciseConfiguration exerciseId={exerciseId} />, {
    wrapper: Wrapper,
  });

  expect(await screen.findByText('Bicep Curl')).toBeVisible();
  expect(screen.getByLabelText('Sets')).toHaveValue(3);
  expect(screen.getByLabelText('Reps')).toHaveValue(8);
  expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
});
