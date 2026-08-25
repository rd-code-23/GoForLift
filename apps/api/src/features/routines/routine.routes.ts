/** Defines authenticated routine-list API routes. */
import {
  routineListResponseSchema,
  type RoutineSummary,
} from '@goforlift/contracts';
import { Router } from 'express';

import {
  getAuthenticatedUserId,
  requireAuthentication,
} from '../auth/guards/authentication.middleware.js';

type RoutineRouterDependencies = {
  listRoutines: (userId: string) => Promise<RoutineSummary[]>;
};

export function createRoutineRouter({
  listRoutines,
}: RoutineRouterDependencies) {
  const router = Router();

  router.get('/', requireAuthentication, async (request, response, next) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const routines = await listRoutines(userId);

      response.status(200).json(routineListResponseSchema.parse({ routines }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
