/** Configures session-bound synchronizer-token CSRF protection for unsafe requests. */
import { csrfSync } from 'csrf-sync';
import type { ErrorRequestHandler } from 'express';

const {
  csrfSynchronisedProtection,
  generateToken,
  invalidCsrfTokenError,
  revokeToken,
} = csrfSync({
  errorConfig: {
    statusCode: 403,
    message: 'Invalid CSRF token',
    code: 'INVALID_CSRF_TOKEN',
  },
});

export const csrfProtection = csrfSynchronisedProtection;
export const generateCsrfToken = generateToken;
export const revokeCsrfToken = revokeToken;

export const csrfErrorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (error === invalidCsrfTokenError) {
    response.status(403).json({ error: 'invalid_csrf_token' });
    return;
  }

  next(error);
};
