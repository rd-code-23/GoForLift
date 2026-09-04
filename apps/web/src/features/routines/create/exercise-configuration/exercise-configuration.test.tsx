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
import { afterEach, expect, it, vi } from 'vitest';

import { RoutineEditor } from '../editor/routine-editor';
import { ExercisePicker } from '../exercise-picker/exercise-picker';
import { RoutineDraftFormProvider } from '../routine-draft-form';
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
    path: '/routines/new/exercises/$exerciseId',
    component: () => <ExerciseConfiguration exerciseId={exerciseId} />,
  });
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/new',
    component: RoutineEditor,
  });
  const exercisePickerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/new/exercises',
    component: ExercisePicker,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/routines/new'] }),
    routeTree: rootRoute.addChildren([
      configurationRoute,
      editorRoute,
      exercisePickerRoute,
    ]),
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

it('shows the selected exercise and initial configuration fields', async () => {
  const user = userEvent.setup();
  const exerciseId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  const fetchMock = vi.fn().mockResolvedValue(
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
  );
  vi.stubGlobal('fetch', fetchMock);

  renderConfiguration(exerciseId);

  await user.type(await screen.findByLabelText('Routine Name'), 'Upper Body');
  await user.click(screen.getByRole('button', { name: 'Add Exercise' }));
  await user.click(await screen.findByRole('link', { name: /Bicep Curl/ }));

  expect(await screen.findByText('Bicep Curl')).toBeVisible();
  expect(screen.getByLabelText('Sets')).toHaveValue(3);
  expect(screen.getByLabelText('Reps')).toHaveValue(8);
  expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled();

  await user.click(screen.getByRole('button', { name: 'Done' }));

  expect(
    await screen.findByRole('heading', { name: 'Exercises (1)' }),
  ).toBeVisible();
  expect(screen.getByText('Bicep Curl')).toBeVisible();
  expect(screen.getByText('10 lb')).toBeVisible();
  expect(screen.getByText('60s')).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Add Exercise' }));

  expect(await screen.findByLabelText('Search exercises')).toBeVisible();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
