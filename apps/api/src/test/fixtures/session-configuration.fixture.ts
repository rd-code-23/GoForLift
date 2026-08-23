/** Provides the shared secure session configuration used by API tests. */
import type { Env } from '../../config/env-schema.js';

export const testSessionConfiguration = {
  SESSION_SECRET: 'test-session-secret-at-least-32-characters',
  SESSION_DURATION_SECONDS: 604800,
  SESSION_COOKIE: {
    name: 'goforlift.sid',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAgeMs: 604800000,
  },
} satisfies Pick<
  Env,
  'SESSION_COOKIE' | 'SESSION_DURATION_SECONDS' | 'SESSION_SECRET'
>;
