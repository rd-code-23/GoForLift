/** Defines built-in and user-owned exercises available for routine building. */
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const exercises = pgTable(
  'exercises',
  {
    /** Primary identifier for the exercise. */
    id: uuid('id').defaultRandom().primaryKey(),

    /** Owning user for a custom exercise; null identifies a built-in exercise. */
    ownerUserId: uuid('owner_user_id').references(() => users.id),

    /** User-visible exercise name, such as Bicep Curl. */
    name: text('name').notNull(),

    /** Optional instructions or explanation for performing the exercise. */
    description: text('description'),

    /** Time when the exercise was created. */
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /** Time when the exercise name or description was last changed. */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('exercises_owner_user_id_idx').on(table.ownerUserId)],
);
