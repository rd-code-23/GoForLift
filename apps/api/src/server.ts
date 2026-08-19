/** Starts the API with database, session, and graceful-shutdown resources. */
import { sql } from 'drizzle-orm';

import { createApp } from './app.js';
import {
  createGoogleOidcRouter,
  discoverGoogleOidc,
} from './auth/google/google-oidc.routes.js';
import { provisionGoogleUser } from './auth/google/google-user.service.js';
import { createPostgresSession } from './auth/session/session.middleware.js';
import { env } from './config/env.js';
import { createDatabase } from './db/client.js';

const { db, pool } = createDatabase(env.DATABASE_URL);
const { middleware: sessionMiddleware, store: sessionStore } =
  createPostgresSession(pool, env);
const oidc = await discoverGoogleOidc(env);
const app = createApp({
  authRouter: createGoogleOidcRouter({
    oidc,
    redirectUri: env.GOOGLE_OIDC_REDIRECT_URI,
    webOrigin: env.WEB_ORIGIN,
    provisionUser: (profile) => provisionGoogleUser(db, profile),
  }),
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
