/** Defines browser-safe exercise-list contracts shared across applications. */
import { z } from 'zod';

export const createExerciseInputSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const exerciseSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  isCustom: z.boolean(),
});

export const exerciseListResponseSchema = z.object({
  exercises: z.array(exerciseSummarySchema),
});

export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type ExerciseListResponse = z.infer<typeof exerciseListResponseSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseInputSchema>;
