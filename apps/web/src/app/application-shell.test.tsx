// Verifies the application shell exposes accessible responsive navigation and active state.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isGuestSession,
  startGuestSession,
} from '../features/auth/guest-session';
import { router } from '../router';
import { createPublicUser } from '../test/fixtures/public-user.fixture';
import { ApplicationShell } from './application-shell';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('application shell', () => {
  it('renders responsive navigation and exits guest mode', async () => {
    const user = userEvent.setup();
    await router.navigate({ to: '/dashboard' });
    startGuestSession();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome, Guest' }),
    ).toBeVisible();
    expect(screen.getAllByText('Guest')).toHaveLength(2);
    expect(screen.getByText('Progress is temporary')).toBeVisible();

    const navigationRegions = screen.getAllByRole('navigation', {
      name: /primary navigation/i,
    });
    expect(navigationRegions).toHaveLength(2);

    for (const navigation of navigationRegions) {
      expect(
        within(navigation).getByRole('link', { name: 'Dashboard' }),
      ).toHaveAttribute('aria-current', 'page');
      expect(
        within(navigation).getByRole('link', { name: 'Routines' }),
      ).toHaveAttribute('href', '/routines');
      expect(
        within(navigation).getByRole('link', { name: 'History' }),
      ).toHaveAttribute('href', '/history');
      expect(
        within(navigation).getByRole('link', { name: 'Settings' }),
      ).toHaveAttribute('href', '/settings');
    }

    expect(isGuestSession()).toBe(true);
    const profileMenus = screen.getAllByRole('button', {
      name: 'Open profile menu',
    });
    expect(profileMenus).toHaveLength(2);
    expect(
      screen.queryByRole('menuitem', { name: 'Exit guest' }),
    ).not.toBeInTheDocument();

    await user.click(profileMenus[0]!);

    const exitAction = screen.getByRole('menuitem', { name: 'Exit guest' });

    await user.click(exitAction);

    expect(isGuestSession()).toBe(false);
    expect(
      await screen.findByRole('heading', { name: 'Train with purpose.' }),
    ).toBeVisible();
  });

  it('exposes registered sign out from the profile menu', async () => {
    const user = userEvent.setup();
    const publicUser = createPublicUser();
    const onLogout = vi.fn();
    const rootRoute = createRootRoute({ component: Outlet });
    const dashboardRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/dashboard',
      component: () => (
        <ApplicationShell
          identity={{ kind: 'user', user: publicUser }}
          onLogout={onLogout}
        >
          <h1>Dashboard</h1>
        </ApplicationShell>
      ),
    });
    const testRouter = createRouter({
      history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
      routeTree: rootRoute.addChildren([dashboardRoute]),
    });

    render(<RouterProvider router={testRouter} />);

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();

    const profileMenus = screen.getAllByRole('button', {
      name: 'Open profile menu',
    });
    await user.click(profileMenus[0]!);
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });
});
