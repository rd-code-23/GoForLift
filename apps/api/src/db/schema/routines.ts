/** Defines reusable workout routines owned by registered users. */
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const routines = pgTable(
  'routines',
  {
    /** Primary identifier for the routine. */
    id: uuid('id').defaultRandom().primaryKey(),

    /** Registered user who owns and controls the routine. */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    /** User-visible routine name, such as Upper Body. */
    name: text('name').notNull(),

    /** Optional description or notes about the routine. */
    description: text('description'),

    /** Time when the routine was created. */
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /** Time when the routine was last changed. */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('routines_user_id_idx').on(table.userId)],
);
