/** Defines registered users and their stable external identity association. */
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    authProvider: text('auth_provider').notNull(),
    authProviderSubject: text('auth_provider_subject').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('users_auth_provider_subject_unique').on(
      table.authProvider,
      table.authProviderSubject,
    ),
  ],
);
