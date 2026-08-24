/** Defines optional recurring local schedule entries for workout routines. */
import { sql } from 'drizzle-orm';
import {
  check,
  pgTable,
  smallint,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { routines } from './routines.js';

export const routineSchedules = pgTable(
  'routine_schedules',
  {
    /** Primary identifier for the planned schedule entry. */
    id: uuid('id').defaultRandom().primaryKey(),

    /** Routine planned for this recurring day and local time. */
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),

    /** Day of week using Sunday 0 through Saturday 6. */
    dayOfWeek: smallint('day_of_week').notNull(),

    /** User-local planned workout time without a time-zone offset. */
    localTime: time('local_time', { precision: 0 }).notNull(),

    /** Time when the schedule entry was created. */
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /** Time when the schedule entry was last changed. */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('routine_schedules_routine_day_time_unique').on(
      table.routineId,
      table.dayOfWeek,
      table.localTime,
    ),
    check(
      'routine_schedules_day_of_week_supported',
      sql`${table.dayOfWeek} BETWEEN 0 AND 6`,
    ),
  ],
);
