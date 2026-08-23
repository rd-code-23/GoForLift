// Verifies the application shell exposes accessible responsive navigation and active state.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { router } from '../../router';
import { startGuestSession } from '../auth/guest-session';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('application shell', () => {
  it('renders desktop and mobile navigation with the current page selected', async () => {
    await router.navigate({ to: '/dashboard' });
    startGuestSession();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    expect(screen.getAllByText('Guest')).toHaveLength(2);
    expect(screen.getAllByText('Progress is temporary')).toHaveLength(2);

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
  });
});
