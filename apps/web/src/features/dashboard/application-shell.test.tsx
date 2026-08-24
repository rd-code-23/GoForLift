// Verifies the application shell exposes accessible responsive navigation and active state.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { router } from '../../router';
import { isGuestSession, startGuestSession } from '../auth/guest-session';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('application shell', () => {
  it('renders responsive navigation and exits guest mode', async () => {
    const user = userEvent.setup();
    await router.navigate({ to: '/dashboard' });
    startGuestSession();
    const queryClient = new QueryClient();
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
});
