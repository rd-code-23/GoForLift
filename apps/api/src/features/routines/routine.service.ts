/** Lists browser-safe routine summaries owned by the authenticated user. */
import type { CreateRoutineInput, RoutineSummary } from '@goforlift/contracts';
import {
  and,
  asc,
  countDistinct,
  desc,
  eq,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  exercises,
  routineExercises,
  routineSchedules,
  routines,
} from '../../db/schema/index.js';
import { InvalidRoutineExerciseSelectionError } from './routine.errors.js';

export async function createRoutineForUser(
  database: NodePgDatabase,
  userId: string,
  input: CreateRoutineInput,
): Promise<RoutineSummary> {
  return database.transaction(async (currentTransaction) => {
    const requestedExerciseIds = [
      ...new Set(input.exercises.map((exercise) => exercise.exerciseId)),
    ];
    const availableExercises = await currentTransaction
      .select({ id: exercises.id })
      .from(exercises)
      .where(
        and(
          inArray(exercises.id, requestedExerciseIds),
          or(isNull(exercises.ownerUserId), eq(exercises.ownerUserId, userId)),
        ),
      );

    // Ensure every requested exercise was available
    //  length check is safe because we  compared requestedExerciseIds, aggainst availableExercises
    // The API deliberately does not reveal which case occurred. It throws one safe business error.
    if (availableExercises.length !== requestedExerciseIds.length) {
      throw new InvalidRoutineExerciseSelectionError();
    }

    const [createdRoutine] = await currentTransaction
      .insert(routines)
      .values({
        userId,
        name: input.name,
        description: input.description ?? null,
      })
      .returning({
        id: routines.id,
        name: routines.name,
        description: routines.description,
        createdAt: routines.createdAt,
        updatedAt: routines.updatedAt,
      });

    if (!createdRoutine) {
      throw new Error('Routine creation did not return a row.');
    }

    await currentTransaction.insert(routineExercises).values(
      input.exercises.map((exercise) => ({
        routineId: createdRoutine.id,
        exerciseId: exercise.exerciseId,
        position: exercise.position,
        sets: exercise.sets,
        targetReps: exercise.targetReps,
        weight: exercise.weight.toString(),
        weightUnit: exercise.weightUnit,
        restBetweenSetsSeconds: exercise.restBetweenSetsSeconds,
        restAfterExerciseSeconds: exercise.restAfterExerciseSeconds,
        notes: exercise.notes ?? null,
      })),
    );

    if (input.schedules.length > 0) {
      await currentTransaction.insert(routineSchedules).values(
        input.schedules.map((schedule) => ({
          routineId: createdRoutine.id,
          dayOfWeek: schedule.dayOfWeek,
          localTime: schedule.localTime,
        })),
      );
    }

    return {
      id: createdRoutine.id,
      name: createdRoutine.name,
      description: createdRoutine.description,
      exerciseCount: input.exercises.length,
      scheduledDays: [
        ...new Set(input.schedules.map((schedule) => schedule.dayOfWeek)),
      ].sort((first, second) => first - second),
      createdAt: createdRoutine.createdAt.toISOString(),
      updatedAt: createdRoutine.updatedAt.toISOString(),
    };
  });
}

export async function listRoutinesForUser(
  database: NodePgDatabase,
  userId: string,
): Promise<RoutineSummary[]> {
  const ownedRoutines = await database
    .select({
      id: routines.id,
      name: routines.name,
      description: routines.description,
      exerciseCount: countDistinct(routineExercises.id),
      scheduledDays: sql<number[]>`
        coalesce(
          array_agg(distinct ${routineSchedules.dayOfWeek})
            filter (where ${routineSchedules.dayOfWeek} is not null),
          array[]::smallint[]
        )
      `,
      createdAt: routines.createdAt,
      updatedAt: routines.updatedAt,
    })
    .from(routines)
    .leftJoin(routineExercises, eq(routineExercises.routineId, routines.id))
    .leftJoin(routineSchedules, eq(routineSchedules.routineId, routines.id))
    .where(eq(routines.userId, userId))
    .groupBy(
      routines.id,
      routines.name,
      routines.description,
      routines.createdAt,
      routines.updatedAt,
    )
    .orderBy(desc(routines.updatedAt), asc(routines.name));

  return ownedRoutines.map((routine) => ({
    ...routine,
    scheduledDays: [...routine.scheduledDays].sort(
      (first, second) => first - second,
    ),
    createdAt: routine.createdAt.toISOString(),
    updatedAt: routine.updatedAt.toISOString(),
  }));
}
