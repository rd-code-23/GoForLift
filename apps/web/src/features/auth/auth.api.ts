/** Provides typed, credentialed requests to the backend authentication API. */
import {
  csrfTokenResponseSchema,
  currentUserResponseSchema,
  type CurrentUserResponse,
} from '@goforlift/contracts';
import type { ZodType } from 'zod';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export class AuthApiError extends Error {
  constructor(public readonly status: number) {
    super(`Authentication API request failed with status ${status}`);
    this.name = 'AuthApiError';
  }
}

export function isAuthenticationRequiredError(error: unknown) {
  return error instanceof AuthApiError && error.status === 401;
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const response = await credentialedFetch('/auth/me');
  if (response.status === 401) {
    return { user: null };
  }

  return parseJsonResponse(response, currentUserResponseSchema);
}

export async function requestWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (!SAFE_METHODS.has(method)) {
    const csrfResponse = await credentialedFetch('/auth/csrf-token');
    const { csrfToken } = await parseJsonResponse(
      csrfResponse,
      csrfTokenResponseSchema,
    );
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await credentialedFetch(input, { ...init, method, headers });
  if (!response.ok) {
    throw new AuthApiError(response.status);
  }

  return response;
}

export async function logout() {
  await requestWithCsrf('/auth/logout', { method: 'POST' });
}

async function credentialedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  return fetch(input, { ...init, credentials: 'include' });
}

async function parseJsonResponse<T>(response: Response, schema: ZodType<T>) {
  if (!response.ok) {
    throw new AuthApiError(response.status);
  }

  const data: unknown = await response.json();
  return schema.parse(data);
}
