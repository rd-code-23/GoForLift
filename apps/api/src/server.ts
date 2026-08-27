/** Starts the API with database, session, and graceful-shutdown resources. */
import { sql } from 'drizzle-orm';
import { Router } from 'express';

import { createApp } from './app.js';
import {
  csrfErrorHandler,
  csrfProtection,
} from './features/auth/csrf/csrf.middleware.js';
import {
  createGoogleOidcRouter,
  discoverGoogleOidc,
} from './features/auth/google/google-oidc.routes.js';
import { provisionGoogleUser } from './features/auth/google/google-user.service.js';
import { createPostgresSession } from './features/auth/session/session.middleware.js';
import { createSessionRouter } from './features/auth/session/session.routes.js';
import { findPublicUserById } from './features/auth/user/current-user.service.js';
import { env } from './config/env.js';
import { createDatabase } from './db/client.js';
import { createExerciseRouter } from './features/exercises/exercise.routes.js';
import {
  createExerciseForUser,
  listExercisesForUser,
} from './features/exercises/exercise.service.js';
import { createRoutineRouter } from './features/routines/routine.routes.js';
import {
  createRoutineForUser,
  listRoutinesForUser,
} from './features/routines/routine.service.js';

const { db, pool } = createDatabase(env.DATABASE_URL);
const { middleware: sessionMiddleware, store: sessionStore } =
  createPostgresSession(pool, env);
const oidc = await discoverGoogleOidc(env);
const authRouter = Router();
authRouter.use(
  createGoogleOidcRouter({
    oidc,
    redirectUri: env.GOOGLE_OIDC_REDIRECT_URI,
    webOrigin: env.WEB_ORIGIN,
    provisionUser: (profile) => provisionGoogleUser(db, profile),
  }),
);

authRouter.use(
  createSessionRouter({
    cookieName: env.SESSION_COOKIE.name,
    cookiePath: env.SESSION_COOKIE.path,
    findPublicUser: (userId) => findPublicUserById(db, userId),
  }),
);

const exerciseRouter = createExerciseRouter({
  createExercise: (userId, input) => createExerciseForUser(db, userId, input),
  listExercises: (userId) => listExercisesForUser(db, userId),
});

const routineRouter = createRoutineRouter({
  createRoutine: (userId, input) => createRoutineForUser(db, userId, input),
  listRoutines: (userId) => listRoutinesForUser(db, userId),
});

const app = createApp({
  authRouter,
  csrfErrorHandler,
  csrfProtection,
  exerciseRouter,
  routineRouter,
  webOrigin: env.WEB_ORIGIN,
  trustProxyHops: env.TRUST_PROXY_HOPS,
  sessionMiddleware,
  checkDatabaseConnection: async () => {
    await db.execute(sql`select 1`);
  },
});

const server = app.listen(env.PORT, () => {
  console.info(`GoForLift API listening on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(() => {
    sessionStore.close();
    void pool.end().then(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
