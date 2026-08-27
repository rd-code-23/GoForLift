/** Defines browser-safe routine-list contracts shared across applications. */
import { z } from 'zod';

export const ROUTINE_NAME_MAX_LENGTH = 100;

export const createRoutineExerciseInputSchema = z
  .object({
    exerciseId: z.uuid(),
    position: z.number().int().nonnegative(),
    sets: z.number().int().positive(),
    targetReps: z.number().int().positive(),
    weight: z.number().nonnegative(),
    weightUnit: z.enum(['lb', 'kg']),
    restBetweenSetsSeconds: z.number().int().nonnegative().default(0),
    restAfterExerciseSeconds: z.number().int().nonnegative().default(0),
    notes: z.string().trim().nullable().optional(),
  })
  .strict();

export const createRoutineScheduleInputSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    localTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/),
  })
  .strict();

export const createRoutineInputSchema = z
  .object({
    name: z.string().trim().min(1).max(ROUTINE_NAME_MAX_LENGTH),
    description: z.string().trim().nullable().optional(),
    exercises: z.array(createRoutineExerciseInputSchema).min(1),
    schedules: z.array(createRoutineScheduleInputSchema).default([]),
  })
  .strict()
  .superRefine((input, context) => {
    // Field-level schemas validate each item independently. These checks compare
    // items across the full request so malformed or modified clients cannot send
    // values that would conflict with the database's uniqueness rules.
    const positions = new Set<number>();

    input.exercises.forEach((exercise, index) => {
      // Two exercises cannot occupy the same ordered position in one routine.
      if (positions.has(exercise.position)) {
        context.addIssue({
          code: 'custom',
          message: 'Exercise positions must be unique.',
          path: ['exercises', index, 'position'],
        });
      }

      positions.add(exercise.position);
    });

    const schedules = new Set<string>();

    input.schedules.forEach((schedule, index) => {
      // The day-and-time pair matches the schedule table's uniqueness boundary.
      const scheduleKey = `${schedule.dayOfWeek}-${schedule.localTime}`;

      if (schedules.has(scheduleKey)) {
        context.addIssue({
          code: 'custom',
          message: 'Routine schedules must be unique.',
          path: ['schedules', index],
        });
      }

      schedules.add(scheduleKey);
    });
  });

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
export type CreateRoutineInput = z.infer<typeof createRoutineInputSchema>;
