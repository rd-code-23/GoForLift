// Verifies the application shell exposes accessible responsive navigation and active state.
import { RouterProvider } from '@tanstack/react-router';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { router } from '../../router';

afterEach(cleanup);

describe('application shell', () => {
  it('renders desktop and mobile navigation with the current page selected', async () => {
    await router.navigate({ to: '/dashboard' });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

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
