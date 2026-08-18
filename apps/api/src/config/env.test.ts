/** Verifies valid, missing, malformed, and environment-specific configuration. */
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEnv } from './env-schema.js';

const validEnvironment = {
  NODE_ENV: 'development',
  PORT: '3000',
  TRUST_PROXY_HOPS: '0',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/goforlift',
  WEB_ORIGIN: 'http://localhost:5173',
  API_ORIGIN: 'http://localhost:3000',
  GOOGLE_CLIENT_ID: 'example-client-id.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'example-client-secret',
  GOOGLE_OIDC_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
  SESSION_SECRET: 'development-only-secret-at-least-32-characters',
  SESSION_DURATION_SECONDS: '604800',
} satisfies NodeJS.ProcessEnv;

describe('parseEnv', () => {
  it('parses valid authentication configuration', () => {
    const parsed = parseEnv(validEnvironment);

    expect(parsed.SESSION_DURATION_SECONDS).toBe(604800);
    expect(parsed.SESSION_COOKIE).toEqual({
      name: 'goforlift.sid',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAgeMs: 604800000,
    });
  });

  it.each([
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_OIDC_REDIRECT_URI',
    'SESSION_SECRET',
  ] as const)('rejects a missing %s', (key) => {
    const environment = { ...validEnvironment };
    delete environment[key];

    expect(() => parseEnv(environment)).toThrow(ZodError);
  });

  it('rejects malformed URLs and session durations', () => {
    expect(() =>
      parseEnv({
        ...validEnvironment,
        GOOGLE_OIDC_REDIRECT_URI: 'not-a-url',
        SESSION_DURATION_SECONDS: 'one week',
      }),
    ).toThrow(ZodError);
  });

  it('rejects a session duration that differs from the approved policy', () => {
    expect(() =>
      parseEnv({
        ...validEnvironment,
        SESSION_DURATION_SECONDS: '86400',
      }),
    ).toThrow('Must match the approved seven-day session lifetime');
  });

  it('requires HTTPS origins and redirects in production', () => {
    expect(() =>
      parseEnv({
        ...validEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('Must use HTTPS in production');
  });

  it('rejects broad trusted-proxy configuration', () => {
    expect(() =>
      parseEnv({
        ...validEnvironment,
        TRUST_PROXY_HOPS: '2',
      }),
    ).toThrow(ZodError);
  });

  it('enables secure cookies for valid production configuration', () => {
    const parsed = parseEnv({
      ...validEnvironment,
      NODE_ENV: 'production',
      WEB_ORIGIN: 'https://app.goforlift.example',
      API_ORIGIN: 'https://api.goforlift.example',
      GOOGLE_OIDC_REDIRECT_URI:
        'https://api.goforlift.example/auth/google/callback',
    });

    expect(parsed.SESSION_COOKIE.secure).toBe(true);
  });
});
