/** Defines current-user, CSRF-token, and logout endpoints for browser sessions. */
import {
  csrfTokenResponseSchema,
  currentUserResponseSchema,
  type PublicUser,
} from '@goforlift/contracts';
import { Router } from 'express';

import { generateCsrfToken, revokeCsrfToken } from '../csrf/csrf.middleware.js';

type SessionRouterOptions = {
  cookieName: string;
  cookiePath: string;
  findPublicUser: (userId: string) => Promise<PublicUser | null>;
};

export function createSessionRouter({
  cookieName,
  cookiePath,
  findPublicUser,
}: SessionRouterOptions) {
  const router = Router();

  router.get('/me', async (request, response, next) => {
    const userId = request.session.userId;
    if (!userId) {
      response
        .status(200)
        .json(currentUserResponseSchema.parse({ user: null }));
      return;
    }

    try {
      const user = await findPublicUser(userId);
      response.status(200).json(currentUserResponseSchema.parse({ user }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/csrf-token', (request, response) => {
    response.status(200).json(
      csrfTokenResponseSchema.parse({
        csrfToken: generateCsrfToken(request),
      }),
    );
  });

  router.post('/logout', (request, response, next) => {
    revokeCsrfToken(request);
    request.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }

      response.clearCookie(cookieName, { path: cookiePath });
      response.sendStatus(204);
    });
  });

  return router;
}
