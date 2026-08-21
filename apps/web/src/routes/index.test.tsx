// Verifies the welcome page's primary entry points and guest-storage notice.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { router } from '../router';

describe('welcome page', () => {
  it('renders the Google and guest entry points', async () => {
    const queryClient = new QueryClient();
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
  });
});
