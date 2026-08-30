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

import { RoutineDraftFormProvider } from '../routine-draft-form';
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
    expect(
      screen.queryByRole('button', { name: 'Preview' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Exercise' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add schedule' })).toBeEnabled();
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
});

function renderEditor() {
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

  render(<RouterProvider router={testRouter} />);

  return testRouter;
}

function TestApplicationLayout() {
  return (
    <RoutineDraftFormProvider>
      <Outlet />
    </RoutineDraftFormProvider>
  );
}
