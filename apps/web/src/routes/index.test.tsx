import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { router } from '../router';

describe('foundation page', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ status: 'ok', database: 'connected' }),
      }),
    );
  });

  it('renders the routed application and API status', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await router.navigate({ to: '/' });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: /ready for liftoff/i }),
    ).toBeVisible();
    expect(
      await screen.findByText(/api and postgresql connected/i),
    ).toBeVisible();
  });
});
