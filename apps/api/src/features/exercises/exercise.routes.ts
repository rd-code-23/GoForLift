/** Defines authenticated exercise-list API routes. */
import {
  createExerciseInputSchema,
  exerciseListResponseSchema,
  exerciseSummarySchema,
  type CreateExerciseInput,
  type ExerciseSummary,
} from '@goforlift/contracts';
import { Router } from 'express';

import {
  getAuthenticatedUserId,
  requireAuthentication,
} from '../auth/guards/authentication.middleware.js';

type ExerciseRouterDependencies = {
  createExercise: (
    userId: string,
    input: CreateExerciseInput,
  ) => Promise<ExerciseSummary>;
  listExercises: (userId: string) => Promise<ExerciseSummary[]>;
};

export function createExerciseRouter({
  createExercise,
  listExercises,
}: ExerciseRouterDependencies) {
  const router = Router();

  router.post('/', requireAuthentication, async (request, response, next) => {
    const inputResult = createExerciseInputSchema.safeParse(request.body);

    if (!inputResult.success) {
      response.status(400).json({ error: 'invalid_request' });
      return;
    }

    try {
      const userId = getAuthenticatedUserId(request);
      const exercise = await createExercise(userId, inputResult.data);

      response.status(201).json(exerciseSummarySchema.parse(exercise));
    } catch (error) {
      next(error);
    }
  });

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
