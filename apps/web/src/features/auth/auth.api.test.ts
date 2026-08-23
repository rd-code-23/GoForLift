/** Verifies credential inclusion, response validation, CSRF attachment, and 401 behavior. */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPublicUser } from '../../test/fixtures/public-user.fixture';
import {
  AuthApiError,
  fetchCurrentUser,
  logout,
  requestWithCsrf,
} from './auth.api';

const publicUser = createPublicUser();

afterEach(() => vi.unstubAllGlobals());

describe('fetchCurrentUser', () => {
  it('fetches and validates the current user with credentials', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ user: publicUser }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCurrentUser()).resolves.toEqual({ user: publicUser });
    expect(fetchMock).toHaveBeenCalledWith('/auth/me', {
      credentials: 'include',
    });
  });

  it('represents a 401 response as anonymous without retrying', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCurrentUser()).resolves.toEqual({ user: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid server response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ user: { id: 'unsafe' } })),
    );

    await expect(fetchCurrentUser()).rejects.toThrow();
  });
});

describe('requestWithCsrf', () => {
  it('fetches and attaches a session-bound token to unsafe requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token-123' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await logout();

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/auth/csrf-token', {
      credentials: 'include',
    });
    const mutationInit = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/auth/logout');
    expect(mutationInit.credentials).toBe('include');
    expect(mutationInit.method).toBe('POST');
    expect(new Headers(mutationInit.headers).get('X-CSRF-Token')).toBe(
      'csrf-token-123',
    );
  });

  it('does not fetch or attach CSRF state for safe requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await requestWithCsrf('/safe-resource');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/safe-resource');
    expect(requestInit.credentials).toBe('include');
    expect(requestInit.method).toBe('GET');
    expect(new Headers(requestInit.headers).has('X-CSRF-Token')).toBe(false);
  });

  it('normalizes authentication failures into a typed error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: 'csrf-token-123' }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(logout()).rejects.toEqual(new AuthApiError(401));
  });
});
