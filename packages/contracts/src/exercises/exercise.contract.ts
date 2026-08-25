/** Defines browser-safe exercise-list contracts shared across applications. */
import { z } from 'zod';

export const EXERCISE_NAME_MAX_LENGTH = 100;

export const createExerciseInputSchema = z
  .object({
    name: z.string().trim().min(1).max(EXERCISE_NAME_MAX_LENGTH),
    description: z.string().trim().nullable().optional(),
  })
  .strict();

export const exerciseSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(EXERCISE_NAME_MAX_LENGTH),
  description: z.string().nullable(),
  isCustom: z.boolean(),
});

export const exerciseListResponseSchema = z.object({
  exercises: z.array(exerciseSummarySchema),
});

export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type ExerciseListResponse = z.infer<typeof exerciseListResponseSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseInputSchema>;
