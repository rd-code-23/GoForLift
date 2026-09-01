/** Verifies selected exercise data is shown in the configuration shell. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormContext, useWatch } from 'react-hook-form';
import { afterEach, expect, it, vi } from 'vitest';

import {
  RoutineDraftFormProvider,
  type RoutineDraftFormValues,
} from './routine-draft-form';
import { ExerciseConfiguration } from './exercise-configuration';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderConfiguration(exerciseId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: TestLayout });
  const configurationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/configure',
    component: () => <ExerciseConfiguration exerciseId={exerciseId} />,
  });
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/new',
    component: DraftExerciseCount,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/configure'] }),
    routeTree: rootRoute.addChildren([configurationRoute, editorRoute]),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function TestLayout() {
  return (
    <RoutineDraftFormProvider>
      <Outlet />
    </RoutineDraftFormProvider>
  );
}

function DraftExerciseCount() {
  const { control } = useFormContext<RoutineDraftFormValues>();
  const exercises = useWatch({ control, name: 'exercises' });

  return <p>Saved exercises: {exercises.length}</p>;
}

it('shows the selected exercise and initial configuration fields', async () => {
  const user = userEvent.setup();
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

  renderConfiguration(exerciseId);

  expect(await screen.findByText('Bicep Curl')).toBeVisible();
  expect(screen.getByLabelText('Sets')).toHaveValue(3);
  expect(screen.getByLabelText('Reps')).toHaveValue(8);
  expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();

  await user.click(screen.getByRole('button', { name: 'Done' }));

  expect(await screen.findByText('Saved exercises: 1')).toBeVisible();
});
