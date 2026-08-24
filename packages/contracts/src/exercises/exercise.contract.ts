/** Defines browser-safe exercise-list contracts shared across applications. */
import { z } from 'zod';

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
