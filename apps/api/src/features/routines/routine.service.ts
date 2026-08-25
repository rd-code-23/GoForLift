/** Lists browser-safe routine summaries owned by the authenticated user. */
import type { RoutineSummary } from '@goforlift/contracts';
import { asc, countDistinct, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  routineExercises,
  routineSchedules,
  routines,
} from '../../db/schema/index.js';

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
