/** Defines authenticated routine-list API routes. */
import {
  createRoutineInputSchema,
  routineListResponseSchema,
  routineDetailSchema,
  routineSummarySchema,
  type CreateRoutineInput,
  type RoutineSummary,
  type RoutineDetail,
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
};

export function createRoutineRouter({
  createRoutine,
  getRoutine,
  listRoutines,
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

  return router;
}
