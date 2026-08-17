import { sql } from 'drizzle-orm';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { createDatabase } from './db/client.js';

const { db, pool } = createDatabase(env.DATABASE_URL);
const app = createApp({
  webOrigin: env.WEB_ORIGIN,
  checkDatabaseConnection: async () => {
    await db.execute(sql`select 1`);
  },
});

const server = app.listen(env.PORT, () => {
  console.info(`GoForLift API listening on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
