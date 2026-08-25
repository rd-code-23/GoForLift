/** Defines authenticated exercise-list API routes. */
import {
  exerciseListResponseSchema,
  type ExerciseSummary,
} from '@goforlift/contracts';
import { Router } from 'express';

import {
  getAuthenticatedUserId,
  requireAuthentication,
} from '../auth/guards/authentication.middleware.js';

type ExerciseRouterDependencies = {
  listExercises: (userId: string) => Promise<ExerciseSummary[]>;
};

export function createExerciseRouter({
  listExercises,
}: ExerciseRouterDependencies) {
  const router = Router();

  router.get('/', requireAuthentication, async (request, response, next) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const exercises = await listExercises(userId);

      response.status(200).json(
        exerciseListResponseSchema.parse({
          exercises,
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}
