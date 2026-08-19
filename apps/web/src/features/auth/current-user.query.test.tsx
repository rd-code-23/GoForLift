/** Verifies loading, anonymous, authenticated, error, and non-looping 401 states. */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCurrentUser } from './current-user.query';

const publicUser = {
  id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
  email: 'lifter@example.com',
  displayName: 'Go For Lifter',
  avatarUrl: null,
};

afterEach(() => vi.unstubAllGlobals());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCurrentUser', () => {
  it('represents the loading state', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.authenticationStatus).toBe('loading');
    expect(result.current.user).toBeNull();
  });

  it('represents the authenticated state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ user: publicUser })),
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.authenticationStatus).toBe('authenticated'),
    );
    expect(result.current.user).toEqual(publicUser);
  });

  it.each([
    ['anonymous response', Response.json({ user: null })],
    ['401 response', new Response(null, { status: 401 })],
  ])('represents %s as anonymous', async (_label, response) => {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.authenticationStatus).toBe('anonymous'),
    );
    expect(result.current.user).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('represents an API failure as an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.authenticationStatus).toBe('error'),
    );
    expect(result.current.user).toBeNull();
  });
});
