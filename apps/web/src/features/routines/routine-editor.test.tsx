/** Verifies the routine editor shell exposes its initial responsive workflow. */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { RoutineEditor } from './routine-editor';

afterEach(cleanup);

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
    expect(screen.getByRole('button', { name: 'Add Exercise' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add schedule' })).toBeDisabled();
    expect(
      screen.getByRole('link', { name: 'Back to routines' }),
    ).toHaveAttribute('href', '/routines');
  });
});

function renderEditor() {
  const rootRoute = createRootRoute();
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/routines/new',
    component: RoutineEditor,
  });
  const testRouter = createRouter({
    history: createMemoryHistory({ initialEntries: ['/routines/new'] }),
    routeTree: rootRoute.addChildren([editorRoute]),
  });

  return render(<RouterProvider router={testRouter} />);
}
