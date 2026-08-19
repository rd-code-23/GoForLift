/** Defines current-user, CSRF-token, and logout endpoints for browser sessions. */
import { Router } from 'express';

import type { PublicUser } from '../user/current-user.service.js';
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
      response.status(200).json({ user: null });
      return;
    }

    try {
      const user = await findPublicUser(userId);
      response.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.get('/csrf-token', (request, response) => {
    response.status(200).json({ csrfToken: generateCsrfToken(request) });
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
