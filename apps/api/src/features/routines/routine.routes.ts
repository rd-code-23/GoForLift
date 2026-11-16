/** Defines authenticated routine-list API routes. */
import {
  createRoutineInputSchema,
  routineListResponseSchema,
  routineDetailSchema,
  routineSummarySchema,
  updateRoutineInputSchema,
  type CreateRoutineInput,
  type RoutineSummary,
  type RoutineDetail,
  type UpdateRoutineInput,
} from '@goforlift/contracts';
import { z } from 'zod';
import { Router } from 'express';

import {
  getAuthenticatedUserId,
  requireAuthentication,
} from '../auth/guards/authentication.middleware.js';
import { InvalidRoutineExerciseSelectionError } from './routine.errors.js';

type RoutineRouterDependencies = {
  createRoutine: (
    userId: string,
    input: CreateRoutineInput,
  ) => Promise<RoutineSummary>;
  listRoutines: (userId: string) => Promise<RoutineSummary[]>;
  getRoutine: (
    userId: string,
    routineId: string,
  ) => Promise<RoutineDetail | null>;
  updateRoutine: (
    userId: string,
    routineId: string,
    input: UpdateRoutineInput,
  ) => Promise<RoutineSummary | null>;
};

export function createRoutineRouter({
  createRoutine,
  getRoutine,
  listRoutines,
  updateRoutine,
}: RoutineRouterDependencies) {
  const router = Router();

  router.post('/', requireAuthentication, async (request, response, next) => {
    const inputResult = createRoutineInputSchema.safeParse(request.body);

    if (!inputResult.success) {
      response.status(400).json({ error: 'invalid_request' });
      return;
    }

    try {
      const userId = getAuthenticatedUserId(request);
      const routine = await createRoutine(userId, inputResult.data);

      response.status(201).json(routineSummarySchema.parse(routine));
    } catch (error) {
      if (error instanceof InvalidRoutineExerciseSelectionError) {
        response.status(400).json({ error: 'invalid_exercise_selection' });
        return;
      }

      next(error);
    }
  });

  router.get('/', requireAuthentication, async (request, response, next) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const routines = await listRoutines(userId);

      response.status(200).json(routineListResponseSchema.parse({ routines }));
    } catch (error) {
      next(error);
    }
  });

  router.get(
    '/:routineId',
    requireAuthentication,
    async (request, response, next) => {
      const routineIdResult = z.uuid().safeParse(request.params.routineId);

      if (!routineIdResult.success) {
        response.status(404).json({ error: 'routine_not_found' });
        return;
      }

      try {
        const userId = getAuthenticatedUserId(request);
        const routine = await getRoutine(userId, routineIdResult.data);

        if (!routine) {
          response.status(404).json({ error: 'routine_not_found' });
          return;
        }

        response.status(200).json(routineDetailSchema.parse(routine));
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    '/:routineId',
    requireAuthentication,
    async (request, response, next) => {
      const routineIdResult = routineDetailSchema.shape.id.safeParse(
        request.params.routineId,
      );
      const inputResult = updateRoutineInputSchema.safeParse(request.body);

      if (!routineIdResult.success || !inputResult.success) {
        response.status(400).json({ error: 'invalid_request' });
        return;
      }

      try {
        const userId = getAuthenticatedUserId(request);
        const routine = await updateRoutine(
          userId,
          routineIdResult.data,
          inputResult.data,
        );

        if (!routine) {
          response.status(404).json({ error: 'routine_not_found' });
          return;
        }

        response.status(200).json(routineSummarySchema.parse(routine));
      } catch (error) {
        if (error instanceof InvalidRoutineExerciseSelectionError) {
          response.status(400).json({ error: 'invalid_exercise_selection' });
          return;
        }

        next(error);
      }
    },
  );

  return router;
}
