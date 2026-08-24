/** Lists exercises visible to the authenticated user. */
import type { ExerciseSummary } from '@goforlift/contracts';
import { asc, eq, isNull, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { exercises } from '../db/schema/index.js';

export async function listExercisesForUser(
  database: NodePgDatabase,
  userId: string,
): Promise<ExerciseSummary[]> {
  const visibleExercises = await database
    .select({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      ownerUserId: exercises.ownerUserId,
    })
    .from(exercises)
    .where(or(isNull(exercises.ownerUserId), eq(exercises.ownerUserId, userId)))
    .orderBy(asc(exercises.name));

  return visibleExercises.map(({ ownerUserId, ...exercise }) => ({
    ...exercise,
    isCustom: ownerUserId !== null,
  }));
}
