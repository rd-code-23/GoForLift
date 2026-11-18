/** Verifies the routine editor shell exposes its initial responsive workflow. */
import { ROUTINE_NAME_MAX_LENGTH } from '@goforlift/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { exercisesQueryKey } from '@/features/exercises/exercises.query';
import { RoutineDraftFormProvider } from '../routine-draft-form';
import { RoutineEditor } from './routine-editor';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('routine editor', () => {
  it('shows the initial editor shell without enabling unfinished actions', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderEditor();

    expect(
      await screen.findByRole('heading', { name: 'Create Routine' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Routine Name')).toHaveAttribute(
      'placeholder',
      'e.g., Upper Body',
    );
    expect(
      screen.getByRole('heading', { name: 'Exercises (0)' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await user.type(screen.getByLabelText('Routine Name'), 'Push Day');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Preview' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Exercise' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add schedule' })).toBeEnabled();
    expect(
      screen.getByRole('link', { name: 'Back to routines' }),
    ).toHaveAttribute('href', '/routines');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows inline errors when saving an incomplete routine', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(await screen.findByRole('button', { name: 'Save' }));

    expect(screen.getByText('Enter a routine name.')).toBeVisible();
    expect(screen.getByText('Add at least one exercise.')).toBeVisible();
    expect(screen.getByText('Complete required fields.')).toBeVisible();

    await user.type(screen.getByLabelText('Routine Name'), 'Push Day');
    expect(screen.getByText('Complete required fields.')).toHaveClass(
      'invisible',
    );

    await user.clear(screen.getByLabelText('Routine Name'));
    expect(screen.getByText('Complete required fields.')).toHaveClass(
      'invisible',
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Complete required fields.')).not.toHaveClass(
      'invisible',
    );
  });

  it('shows live validation and clears the error after correction', async () => {
    const user = userEvent.setup();
    renderEditor();

    const routineNameInput = await screen.findByLabelText('Routine Name');

    await user.type(routineNameInput, 'x');
    await user.clear(routineNameInput);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a routine name.',
    );
    expect(routineNameInput).toHaveAttribute('aria-invalid', 'true');

    await user.type(routineNameInput, 'x'.repeat(ROUTINE_NAME_MAX_LENGTH + 1));

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(routineNameInput).toHaveAttribute('aria-invalid', 'true');

    await user.clear(routineNameInput);
    await user.type(routineNameInput, 'Push');

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(routineNameInput).not.toHaveAttribute('aria-invalid');
  });

  it('clears the draft and its validation state when requested', async () => {
    const user = userEvent.setup();
    renderEditor();
    const routineNameInput = await screen.findByLabelText('Routine Name');

    await user.type(routineNameInput, 'x'.repeat(ROUTINE_NAME_MAX_LENGTH + 1));
    expect(await screen.findByRole('alert')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Add schedule' }));
    await user.click(screen.getByRole('switch', { name: 'Schedule Monday' }));
    await user.click(screen.getByRole('button', { name: 'Save Schedule' }));
    expect(screen.getByText('Mon')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(routineNameInput).toHaveValue('');
    expect(routineNameInput).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Mon')).toBeNull();
  });

  it('keeps the current draft and opens exercises when the name is invalid', async () => {
    const user = userEvent.setup();
    const router = renderEditor();
    const invalidName = 'x'.repeat(ROUTINE_NAME_MAX_LENGTH + 1);
    const routineNameInput = await screen.findByLabelText('Routine Name');

    await user.type(routineNameInput, invalidName);

    expect(await screen.findByRole('alert')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Add Exercise' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/routines/new/exercises'),
    );

    await user.click(screen.getByRole('link', { name: 'Back to editor' }));

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByLabelText('Routine Name')).toHaveValue(invalidName);
  });

  it('keeps the draft while visiting a different application page', async () => {
    const user = userEvent.setup();
    const router = renderEditor();
    const invalidName = 'x'.repeat(ROUTINE_NAME_MAX_LENGTH + 1);

    await user.type(await screen.findByLabelText('Routine Name'), invalidName);
    expect(await screen.findByRole('alert')).toBeVisible();

    await router.navigate({ to: '/history' });
    expect(
      await screen.findByRole('heading', { name: 'History' }),
    ).toBeVisible();

    await router.navigate({ to: '/routines/new' });
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByLabelText('Routine Name')).toHaveValue(invalidName);
  });

  it('prefills and updates an existing routine', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token-123' }))
      .mockResolvedValueOnce(
        Response.json({
          id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          name: 'Updated Upper Body',
          description: 'Monday training plan',
          exerciseCount: 1,
          scheduledDays: [1],
          createdAt: '2026-08-26T10:00:00.000Z',
          updatedAt: '2026-08-27T10:00:00.000Z',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const router = renderEditEditor();

    expect(
      await screen.findByRole('heading', { name: 'Edit Routine' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Routine Name')).toHaveValue('Upper Body');
    expect(screen.queryByLabelText(/Description/)).not.toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeVisible();

    await user.clear(screen.getByLabelText('Routine Name'));
    await user.type(
      screen.getByLabelText('Routine Name'),
      'Updated Upper Body',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const requestInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      '/api/routines/26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
    );
    expect(requestInit.method).toBe('PATCH');
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      name: 'Updated Upper Body',
      description: 'Monday training plan',
      exercises: [
        {
          exerciseId: '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
          position: 0,
        },
      ],
    });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/routines'),
    );
  });

  it('deletes an existing routine from the editor after confirmation', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token-123' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const router = renderEditEditor();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Routine' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Delete Routine?' }),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      '/api/routines/26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
    );
    expect(router.state.location.pathname).toBe('/routines');
  });
});

function renderEditor() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(exercisesQueryKey, { exercises: [] });
  const rootRoute = createRootRoute({ component: TestApplicationLayout });
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/new',
    component: RoutineEditor,
  });
  const exercisePickerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/new/exercises',
    component: () => <Link to="/routines/new">Back to editor</Link>,
  });
  const historyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/history',
    component: () => <h1>History</h1>,
  });
  const testRouter = createRouter({
    history: createMemoryHistory({ initialEntries: ['/routines/new'] }),
    routeTree: rootRoute.addChildren([
      editorRoute,
      exercisePickerRoute,
      historyRoute,
    ]),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={testRouter} />
    </QueryClientProvider>,
  );

  return testRouter;
}

function TestApplicationLayout() {
  return (
    <RoutineDraftFormProvider>
      <Outlet />
    </RoutineDraftFormProvider>
  );
}

function renderEditEditor() {
  const routineId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  const exerciseId = '16d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(exercisesQueryKey, {
    exercises: [
      {
        id: exerciseId,
        name: 'Bench Press',
        description: null,
        isCustom: false,
      },
    ],
  });
  const rootRoute = createRootRoute({
    component: () => (
      <RoutineDraftFormProvider
        defaultValues={{
          name: 'Upper Body',
          description: 'Monday training plan',
          exercises: [
            {
              draftExerciseId: '06d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
              exerciseId,
              position: 0,
              sets: 3,
              targetReps: 8,
              weight: 10,
              weightUnit: 'lb',
              restBetweenSetsSeconds: 60,
              restAfterExerciseSeconds: 0,
              notes: null,
            },
          ],
          schedules: [{ dayOfWeek: 1, localTime: '18:00:00' }],
        }}
      >
        <Outlet />
      </RoutineDraftFormProvider>
    ),
  });
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/$routineId/edit',
    component: () => <RoutineEditor mode="edit" routineId={routineId} />,
  });
  const routinesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines',
    component: () => <h1>Routines</h1>,
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: [`/routines/${routineId}/edit`],
    }),
    routeTree: rootRoute.addChildren([editorRoute, routinesRoute]),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}
