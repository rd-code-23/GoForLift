/** Verifies secure Google authorization redirects and return-path validation. */
import express from 'express';
import session from 'express-session';
import { calculatePKCECodeChallenge, Configuration } from 'openid-client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import {
  createGoogleOidcRouter,
  type OidcFlowState,
  validateReturnTo,
} from './google-oidc.js';
import { createSessionMiddleware } from './session.js';

const redirectUri = 'http://localhost:3000/auth/google/callback';
const sessionConfiguration = {
  SESSION_SECRET: 'test-session-secret-at-least-32-characters',
  SESSION_DURATION_SECONDS: 604800,
  SESSION_COOKIE: {
    name: 'goforlift.sid',
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    path: '/',
    maxAgeMs: 604800000,
  },
};

function createTestContext() {
  const store = new session.MemoryStore();
  const oidc = new Configuration(
    {
      issuer: 'https://accounts.google.com',
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    'google-client-id',
    'google-client-secret',
  );
  const app = express();
  app.use(createSessionMiddleware(store, sessionConfiguration));
  app.use('/auth', createGoogleOidcRouter(oidc, redirectUri));

  return { app, store };
}

function readStoredFlow(store: session.MemoryStore) {
  const sessions = (store as unknown as { sessions: Record<string, string> })
    .sessions;
  const serializedSession = Object.values(sessions)[0];

  if (!serializedSession) {
    throw new Error('Expected the test session to be stored');
  }

  const storedSession = JSON.parse(serializedSession) as {
    oidcFlow?: OidcFlowState;
  };
  if (!storedSession.oidcFlow) {
    throw new Error('Expected OIDC flow state in the test session');
  }

  return storedSession.oidcFlow;
}

describe('GET /auth/google', () => {
  it('redirects with state, nonce, PKCE, and minimal OIDC scopes', async () => {
    const { app, store } = createTestContext();
    const response = await request(app).get(
      '/auth/google?returnTo=%2Froutines%3Ftab%3Dmine',
    );
    const location = new URL(response.headers.location as string);
    const flow = readStoredFlow(store);

    expect(response.status).toBe(302);
    expect(location.origin + location.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(location.searchParams.get('client_id')).toBe('google-client-id');
    expect(location.searchParams.get('redirect_uri')).toBe(redirectUri);
    expect(location.searchParams.get('response_type')).toBe('code');
    expect(location.searchParams.get('scope')).toBe('openid email profile');
    expect(location.searchParams.get('state')).toBe(flow.state);
    expect(location.searchParams.get('nonce')).toBe(flow.nonce);
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');
    expect(location.searchParams.get('code_challenge')).toBe(
      await calculatePKCECodeChallenge(flow.codeVerifier),
    );
    expect(flow.codeVerifier).toBeTruthy();
    expect(flow.returnTo).toBe('/routines?tab=mine');
  });

  it('generates new protected values for each login attempt', async () => {
    const first = createTestContext();
    await request(first.app).get('/auth/google');
    const firstFlow = readStoredFlow(first.store);

    const second = createTestContext();
    await request(second.app).get('/auth/google');
    const secondFlow = readStoredFlow(second.store);

    expect(secondFlow.state).not.toBe(firstFlow.state);
    expect(secondFlow.nonce).not.toBe(firstFlow.nonce);
    expect(secondFlow.codeVerifier).not.toBe(firstFlow.codeVerifier);
  });
});

describe('validateReturnTo', () => {
  it.each([
    'https://attacker.example',
    '//attacker.example',
    '/\\attacker.example',
    '/%2Fattacker.example',
    '/%252Fattacker.example',
    'javascript:alert(1)',
    '/path%00suffix',
  ])('rejects unsafe destination %s', (destination) => {
    expect(validateReturnTo(destination)).toBe('/');
  });

  it('accepts a root-relative application destination', () => {
    expect(validateReturnTo('/workouts/history?filter=recent')).toBe(
      '/workouts/history?filter=recent',
    );
  });
});
