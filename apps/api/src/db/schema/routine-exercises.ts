/** Defines ordered exercise plans and configuration within reusable routines. */
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { exercises } from './exercises.js';
import { routines } from './routines.js';

export const routineExercises = pgTable(
  'routine_exercises',
  {
    /** Primary identifier for this routine exercise configuration. */
    id: uuid('id').defaultRandom().primaryKey(),

    /** Routine containing the configured exercise. */
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),

    /** Exercise selected for this position in the routine. */
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'no action' }),

    /** Zero-based position determining exercise order within the routine. */
    position: integer('position').notNull(),

    /** Number of planned sets for the exercise. */
    sets: integer('sets').notNull(),

    /** Planned repetitions for each set in the MVP. */
    targetReps: integer('target_reps').notNull(),

    /** Planned weight shared by all sets, stored with two decimal places. */
    weight: numeric('weight', { precision: 8, scale: 2 }).notNull(),

    /** Unit used by the planned weight; restricted to lb or kg for the MVP. */
    weightUnit: text('weight_unit').notNull(),

    /** Rest duration after a set before continuing the exercise. */
    restBetweenSetsSeconds: integer('rest_between_sets_seconds')
      .default(0)
      .notNull(),

    /** Additional rest duration before beginning the next exercise. */
    restAfterExerciseSeconds: integer('rest_after_exercise_seconds')
      .default(0)
      .notNull(),

    /** Optional notes specific to this exercise within the routine. */
    notes: text('notes'),

    /** Time when this routine exercise configuration was created. */
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /** Time when this routine exercise configuration was last changed. */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('routine_exercises_routine_position_unique').on(
      table.routineId,
      table.position,
    ),
    index('routine_exercises_exercise_id_idx').on(table.exerciseId),
    check(
      'routine_exercises_position_nonnegative',
      sql`${table.position} >= 0`,
    ),
    check('routine_exercises_sets_positive', sql`${table.sets} > 0`),
    check(
      'routine_exercises_target_reps_positive',
      sql`${table.targetReps} > 0`,
    ),
    check('routine_exercises_weight_nonnegative', sql`${table.weight} >= 0`),
    check(
      'routine_exercises_weight_unit_supported',
      sql`${table.weightUnit} IN ('lb', 'kg')`,
    ),
    check(
      'routine_exercises_rest_between_sets_nonnegative',
      sql`${table.restBetweenSetsSeconds} >= 0`,
    ),
    check(
      'routine_exercises_rest_after_exercise_nonnegative',
      sql`${table.restAfterExerciseSeconds} >= 0`,
    ),
  ],
);
