// Verifies the welcome page's primary entry points and guest-storage notice.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { router } from '../router';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('welcome page', () => {
  it('renders both entry points and starts a temporary guest session', async () => {
    const queryClient = new QueryClient();
    sessionStorage.clear();
    await router.navigate({ to: '/' });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole('heading', { name: /train with purpose/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: /continue with google/i }),
    ).toHaveAttribute('href', '/auth/google');
    expect(
      screen.getByRole('button', { name: /continue as guest/i }),
    ).toBeEnabled();
    expect(screen.getByText(/guest progress is temporary/i)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /continue as guest/i }));

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
    expect(sessionStorage.getItem('goforlift.guest')).toBe('true');
    expect(router.state.location.pathname).toBe('/dashboard');

    await router.navigate({ to: '/' });
    await waitFor(() => {
      expect(sessionStorage.getItem('goforlift.guest')).toBeNull();
    });
  });
});
