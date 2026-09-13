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
    component: ConfigurationRoute,
  });

  function ConfigurationRoute() {
    const { position } = configurationRoute.useSearch();

    return (
      <ExerciseConfiguration editPosition={position} exerciseId={exerciseId} />
    );
  }
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
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

  await user.click(
    screen.getByRole('button', { name: 'Actions for Bicep Curl' }),
  );
  await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

  const setsInput = await screen.findByLabelText('Sets');
  await user.clear(setsInput);
  await user.type(setsInput, '5');
  await user.click(screen.getByRole('button', { name: 'Done' }));

  expect(
    await screen.findByRole('heading', { name: 'Exercises (1)' }),
  ).toBeVisible();
  expect(screen.getByTitle('5')).toBeVisible();

  await user.click(
    screen.getByRole('button', { name: 'Actions for Bicep Curl' }),
  );
  await user.click(screen.getByRole('menuitem', { name: 'Remove' }));

  expect(
    await screen.findByRole('heading', { name: 'Exercises (0)' }),
  ).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Add Exercise' }));

  expect(await screen.findByLabelText('Search exercises')).toBeVisible();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('allows a custom exercise name to be edited', async () => {
  const user = userEvent.setup();
  const exerciseId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/auth/csrf-token') {
      return Promise.resolve(Response.json({ csrfToken: 'csrf-token' }));
    }

    if (init?.method === 'PATCH') {
      return Promise.resolve(
        Response.json({
          id: exerciseId,
          name: 'Renamed Curl',
          description: null,
          isCustom: true,
        }),
      );
    }

    return Promise.resolve(
      Response.json({
        exercises: [
          {
            id: exerciseId,
            name: 'Custom Curl',
            description: null,
            isCustom: true,
          },
        ],
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);

  renderConfiguration(exerciseId);
  await user.click(await screen.findByRole('button', { name: 'Add Exercise' }));
  await user.click(await screen.findByRole('link', { name: /Custom Curl/ }));
  await user.click(await screen.findByRole('button', { name: 'Edit name' }));

  const nameInput = screen.getByLabelText('Exercise Name');
  await user.clear(nameInput);
  await user.type(nameInput, 'Renamed Curl');
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByText('Renamed Curl')).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Configure Exercise' }),
  ).toBeVisible();
  expect(screen.getByLabelText('Sets')).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/exercises/${exerciseId}`,
    expect.objectContaining({ method: 'PATCH' }),
  );

  await user.click(screen.getByRole('button', { name: 'Done' }));

  expect(
    await screen.findByRole('heading', { name: 'Exercises (1)' }),
  ).toBeVisible();
  expect(screen.getByText('Renamed Curl')).toBeVisible();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('deletes a custom exercise and removes it from the routine draft', async () => {
  const user = userEvent.setup();
  const exerciseId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/auth/csrf-token') {
      return Promise.resolve(Response.json({ csrfToken: 'csrf-token' }));
    }

    if (init?.method === 'DELETE') {
      return Promise.resolve(new Response(null, { status: 204 }));
    }

    return Promise.resolve(
      Response.json({
        exercises: [
          {
            id: exerciseId,
            name: 'Custom Curl',
            description: null,
            isCustom: true,
          },
        ],
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);

  renderConfiguration(exerciseId);
  await user.click(await screen.findByRole('button', { name: 'Add Exercise' }));
  await user.click(await screen.findByRole('link', { name: /Custom Curl/ }));
  await user.click(await screen.findByRole('button', { name: 'Done' }));
  await user.click(
    await screen.findByRole('button', { name: 'Actions for Custom Curl' }),
  );
  await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
  await user.click(
    await screen.findByRole('button', { name: 'Delete exercise' }),
  );

  expect(
    screen.getByRole('heading', { name: 'Delete Custom Exercise?' }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Delete' }));

  expect(
    await screen.findByRole('heading', { name: 'Exercises (0)' }),
  ).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/exercises/${exerciseId}`,
    expect.objectContaining({ method: 'DELETE' }),
  );
});
