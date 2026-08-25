/** Configures typed, PostgreSQL-backed server-side application sessions. */
import connectPgSimple from 'connect-pg-simple';
import session, { type Store } from 'express-session';
import type { Pool } from 'pg';

import type { Env } from '../../../config/env-schema.js';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const PgSessionStore = connectPgSimple(session);
const DAILY_PRUNE_INTERVAL_SECONDS = 24 * 60 * 60;

type SessionConfiguration = Pick<
  Env,
  'SESSION_COOKIE' | 'SESSION_DURATION_SECONDS' | 'SESSION_SECRET'
>;

export function createPostgresSessionStore(
  pool: Pool,
  sessionDurationSeconds: number,
) {
  return new PgSessionStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: false,
    ttl: sessionDurationSeconds,
    disableTouch: true,
    pruneSessionInterval: DAILY_PRUNE_INTERVAL_SECONDS,
    errorLog: () => console.error('PostgreSQL session store operation failed'),
  });
}

export function createSessionMiddleware(
  store: Store,
  configuration: SessionConfiguration,
) {
  const { SESSION_COOKIE: cookie, SESSION_SECRET: secret } = configuration;

  return session({
    store,
    secret,
    name: cookie.name,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAgeMs,
    },
  });
}

export function createPostgresSession(
  pool: Pool,
  configuration: SessionConfiguration,
) {
  const store = createPostgresSessionStore(
    pool,
    configuration.SESSION_DURATION_SECONDS,
  );

  return {
    store,
    middleware: createSessionMiddleware(store, configuration),
  };
}
