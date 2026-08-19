/** Provides reusable test middleware for establishing a server-side session identity. */
import type { RequestHandler } from 'express';

const TEST_USER_HEADER = 'x-test-authenticated-user-id';

export function establishAuthenticatedTestSession(): RequestHandler {
  return (request, _response, next) => {
    const userId = request.header(TEST_USER_HEADER);
    if (userId) {
      request.session.userId = userId;
    }
    next();
  };
}

export function withAuthenticatedTestUser(userId: string) {
  return { [TEST_USER_HEADER]: userId };
}
