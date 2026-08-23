// Verifies dashboard access states with an isolated router and query cache for each case.
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
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPublicUser } from '../../test/fixtures/public-user.fixture';
import { startGuestSession } from '../auth/guest-session';
import { DashboardAccessBoundary } from './dashboard-access-boundary';

const publicUser = createPublicUser();

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('dashboard access boundary', () => {
  it('allows an authenticated visitor into the dashboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ user: publicUser })),
    );
    renderDashboard();

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });

  it('allows an active guest without waiting for the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    startGuestSession();
    renderDashboard();

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });

  it('redirects an anonymous visitor to the welcome page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ user: null })),
    );
    renderDashboard();

    expect(
      await screen.findByRole('heading', { name: 'Welcome' }),
    ).toBeVisible();
  });

  it('shows a loading state while authentication is unresolved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    renderDashboard();

    expect(await screen.findByText('Checking your session…')).toBeVisible();
  });

  it('shows a recoverable error when authentication cannot be verified', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );
    renderDashboard();

    expect(
      await screen.findByText("We couldn't verify your session."),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});

function renderDashboard() {
  const rootRoute = createRootRoute({ component: Outlet });
  const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <h1>Welcome</h1>,
  });
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: () => (
      <DashboardAccessBoundary>
        <h1>Dashboard</h1>
      </DashboardAccessBoundary>
    ),
  });
  const testRouter = createRouter({
    history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
    routeTree: rootRoute.addChildren([welcomeRoute, dashboardRoute]),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={testRouter} />
    </QueryClientProvider>,
  );
}
