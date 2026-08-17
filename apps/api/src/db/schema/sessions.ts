/** Defines the PostgreSQL table used for server-side authentication sessions. */
import { index, json, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', { mode: 'date', precision: 6 }).notNull(),
  },
  (table) => [index('sessions_expire_idx').on(table.expire)],
);
