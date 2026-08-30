/** Verifies the routine editor shell exposes its initial responsive workflow. */
import { ROUTINE_NAME_MAX_LENGTH } from '@goforlift/contracts';
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
import { afterEach, describe, expect, it } from 'vitest';

import { RoutineDraftFormProvider } from './routine-draft-form';
import { RoutineEditor } from './routine-editor';

afterEach(() => {
  cleanup();
});

describe('routine editor', () => {
  it('shows the initial editor shell without enabling unfinished actions', async () => {
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
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add Exercise' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add schedule' })).toBeDisabled();
    expect(
      screen.getByRole('link', { name: 'Back to routines' }),
    ).toHaveAttribute('href', '/routines');
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
});

function renderEditor() {
  const rootRoute = createRootRoute();
  const routineCreationRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'routine-creation',
    component: TestRoutineCreationLayout,
  });
  const editorRoute = createRoute({
    getParentRoute: () => routineCreationRoute,
    path: '/routines/new',
    component: RoutineEditor,
  });
  const exercisePickerRoute = createRoute({
    getParentRoute: () => routineCreationRoute,
    path: '/routines/new/exercises',
    component: () => <Link to="/routines/new">Back to editor</Link>,
  });
  const testRouter = createRouter({
    history: createMemoryHistory({ initialEntries: ['/routines/new'] }),
    routeTree: rootRoute.addChildren([
      routineCreationRoute.addChildren([editorRoute, exercisePickerRoute]),
    ]),
  });

  render(<RouterProvider router={testRouter} />);

  return testRouter;
}

function TestRoutineCreationLayout() {
  return (
    <RoutineDraftFormProvider>
      <Outlet />
    </RoutineDraftFormProvider>
  );
}
