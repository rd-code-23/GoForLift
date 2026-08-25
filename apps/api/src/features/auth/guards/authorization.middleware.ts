/** Enforces fail-closed authorization checks using the trusted session identity. */
import type { RequestHandler } from 'express';

import {
  isAuthenticatedRequest,
  type AuthenticatedRequest,
} from './authentication.middleware.js';

export type AuthorizationCheck = (
  request: AuthenticatedRequest,
) => boolean | Promise<boolean>;

export function requireAuthorization(
  isAuthorized: AuthorizationCheck,
): RequestHandler {
  return async (request, response, next) => {
    if (!isAuthenticatedRequest(request)) {
      response.status(401).json({ error: 'authentication_required' });
      return;
    }

    try {
      if (!(await isAuthorized(request))) {
        response.status(403).json({ error: 'forbidden' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
