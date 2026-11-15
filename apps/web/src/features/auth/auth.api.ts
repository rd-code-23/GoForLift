/** Provides typed, credentialed requests to the backend authentication API. */
import {
  csrfTokenResponseSchema,
  currentUserResponseSchema,
  type CurrentUserResponse,
} from '@goforlift/contracts';

import {
  ensureSuccessfulResponse,
  isAuthenticationRequiredError,
  parseApiJsonResponse,
} from '@/lib/api-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export { isAuthenticationRequiredError };

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const response = await credentialedFetch('/auth/me');
  if (response.status === 401) {
    return { user: null };
  }

  return parseApiJsonResponse(response, currentUserResponseSchema);
}

export async function requestWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (!SAFE_METHODS.has(method)) {
    const csrfResponse = await credentialedFetch('/auth/csrf-token');
    const { csrfToken } = await parseApiJsonResponse(
      csrfResponse,
      csrfTokenResponseSchema,
    );
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await credentialedFetch(input, { ...init, method, headers });
  return ensureSuccessfulResponse(response);
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
