/** Defines browser-safe routine-list contracts shared across applications. */
import { z } from 'zod';

export const routineSummarySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  exerciseCount: z.number().int().nonnegative(),
  scheduledDays: z.array(z.number().int().min(0).max(6)),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const routineListResponseSchema = z.object({
  routines: z.array(routineSummarySchema),
});

export type RoutineSummary = z.infer<typeof routineSummarySchema>;
export type RoutineListResponse = z.infer<typeof routineListResponseSchema>;
