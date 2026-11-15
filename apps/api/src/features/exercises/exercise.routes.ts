/** Defines authenticated exercise-list API routes. */
import {
  createExerciseInputSchema,
  exerciseListResponseSchema,
  exerciseSummarySchema,
  updateExerciseInputSchema,
  type CreateExerciseInput,
  type ExerciseSummary,
  type UpdateExerciseInput,
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
  deleteExercise: (userId: string, exerciseId: string) => Promise<boolean>;
  updateExercise: (
    userId: string,
    exerciseId: string,
    input: UpdateExerciseInput,
  ) => Promise<ExerciseSummary | null>;
};

export function createExerciseRouter({
  createExercise,
  deleteExercise,
  listExercises,
  updateExercise,
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

  router.patch(
    '/:exerciseId',
    requireAuthentication,
    async (request, response, next) => {
      const exerciseIdResult = exerciseSummarySchema.shape.id.safeParse(
        request.params.exerciseId,
      );
      const inputResult = updateExerciseInputSchema.safeParse(request.body);

      if (!exerciseIdResult.success || !inputResult.success) {
        response.status(400).json({ error: 'invalid_request' });
        return;
      }

      try {
        const userId = getAuthenticatedUserId(request);
        const exercise = await updateExercise(
          userId,
          exerciseIdResult.data,
          inputResult.data,
        );

        if (!exercise) {
          response.status(404).json({ error: 'exercise_not_found' });
          return;
        }

        response.status(200).json(exerciseSummarySchema.parse(exercise));
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    '/:exerciseId',
    requireAuthentication,
    async (request, response, next) => {
      const exerciseIdResult = exerciseSummarySchema.shape.id.safeParse(
        request.params.exerciseId,
      );

      if (!exerciseIdResult.success) {
        response.status(400).json({ error: 'invalid_request' });
        return;
      }

      try {
        const userId = getAuthenticatedUserId(request);
        const wasDeleted = await deleteExercise(userId, exerciseIdResult.data);

        if (!wasDeleted) {
          response.status(404).json({ error: 'exercise_not_found' });
          return;
        }

        response.sendStatus(204);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
