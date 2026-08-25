/** Lists exercises visible to the authenticated user. */
import type {
  CreateExerciseInput,
  ExerciseSummary,
} from '@goforlift/contracts';
import { asc, eq, isNull, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { exercises } from '../../db/schema/index.js';

export async function createExerciseForUser(
  database: NodePgDatabase,
  userId: string,
  input: CreateExerciseInput,
): Promise<ExerciseSummary> {
  const [createdExercise] = await database
    .insert(exercises)
    .values({
      ownerUserId: userId,
      name: input.name,
      description: input.description ?? null,
    })
    .returning({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
    });

  if (!createdExercise) {
    throw new Error('Exercise creation did not return a row.');
  }

  return {
    ...createdExercise,
    isCustom: true,
  };
}

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
