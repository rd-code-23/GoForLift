/** Establishes a typed, trusted request identity from the server-side session. */
import type { Request, RequestHandler } from 'express';

export type AuthenticatedRequest = Request & {
  session: Request['session'] & { userId: string };
};

export function isAuthenticatedRequest(
  request: Request,
): request is AuthenticatedRequest {
  return (
    typeof request.session.userId === 'string' &&
    request.session.userId.length > 0
  );
}

export function getAuthenticatedUserId(request: Request) {
  if (!isAuthenticatedRequest(request)) {
    throw new Error('Authenticated request identity is unavailable');
  }

  return request.session.userId;
}

export const requireAuthentication: RequestHandler = (
  request,
  response,
  next,
) => {
  const userId = request.session.userId;
  if (typeof userId !== 'string' || userId.length === 0) {
    response.status(401).json({ error: 'authentication_required' });
    return;
  }

  next();
};
