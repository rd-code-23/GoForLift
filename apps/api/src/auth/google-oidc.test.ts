/** Verifies secure Google authorization redirects and return-path validation. */
import express from 'express';
import session from 'express-session';
import { calculatePKCECodeChallenge, Configuration } from 'openid-client';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import {
  createGoogleOidcRouter,
  type ExchangeAuthorizationCode,
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

type TestContextOptions = {
  exchangeAuthorizationCode?: ExchangeAuthorizationCode;
  now?: () => number;
  provisionUser?: (profile: {
    avatarUrl?: string;
    displayName?: string;
    email: string;
    subject: string;
  }) => Promise<{ id: string }>;
};

function createTestContext(options: TestContextOptions = {}) {
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
  app.use(
    '/auth',
    createGoogleOidcRouter({
      oidc,
      redirectUri,
      webOrigin: 'http://localhost:5173',
      provisionUser:
        options.provisionUser ?? (() => Promise.resolve({ id: 'user-123' })),
      exchangeAuthorizationCode: options.exchangeAuthorizationCode,
      now: options.now,
    }),
  );

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

function readStoredSession(store: session.MemoryStore) {
  const sessions = (store as unknown as { sessions: Record<string, string> })
    .sessions;
  const serializedSession = Object.values(sessions)[0];

  if (!serializedSession) {
    throw new Error('Expected the test session to be stored');
  }

  return JSON.parse(serializedSession) as {
    oidcFlow?: OidcFlowState;
    userId?: string;
  };
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

describe('GET /auth/google/callback', () => {
  it('provisions the verified subject and regenerates the session', async () => {
    const provisionUser = vi.fn(() =>
      Promise.resolve({ id: 'application-user-123' }),
    );
    const exchangeAuthorizationCode = vi.fn<ExchangeAuthorizationCode>(
      (_oidc, callbackUrl, checks) => {
        expect(callbackUrl.origin + callbackUrl.pathname).toBe(redirectUri);
        expect(callbackUrl.searchParams.get('code')).toBe('authorization-code');
        expect(callbackUrl.searchParams.get('state')).toBe(
          checks.expectedState,
        );
        expect(checks.expectedNonce).toBeTruthy();
        expect(checks.pkceCodeVerifier).toBeTruthy();
        expect(checks.idTokenExpected).toBe(true);

        return Promise.resolve({
          claims: () => ({
            sub: 'google-subject-123',
            email: 'user@example.com',
            name: 'Go For Lifter',
            picture: 'https://images.example.com/avatar.png',
          }),
        });
      },
    );
    const { app, store } = createTestContext({
      exchangeAuthorizationCode,
      provisionUser,
    });
    const agent = request.agent(app);
    const initiation = await agent.get('/auth/google?returnTo=%2Froutines');
    const initialCookie = initiation.headers['set-cookie']?.[0];
    const flow = readStoredFlow(store);

    const response = await agent.get(
      `/auth/google/callback?code=authorization-code&state=${flow.state}`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('http://localhost:5173/routines');
    expect(response.headers['set-cookie']?.[0]).not.toBe(initialCookie);
    expect(provisionUser).toHaveBeenCalledWith({
      subject: 'google-subject-123',
      email: 'user@example.com',
      displayName: 'Go For Lifter',
      avatarUrl: 'https://images.example.com/avatar.png',
    });
    expect(readStoredSession(store)).toEqual(
      expect.objectContaining({ userId: 'application-user-123' }),
    );
    expect(readStoredSession(store).oidcFlow).toBeUndefined();
    expect(JSON.stringify(readStoredSession(store))).not.toContain(
      'authorization-code',
    );
  });

  it('rejects a tampered state without provisioning a user', async () => {
    const provisionUser = vi.fn(() => Promise.resolve({ id: 'user-123' }));
    const exchangeAuthorizationCode: ExchangeAuthorizationCode = (
      _oidc,
      callbackUrl,
      checks,
    ) => {
      if (callbackUrl.searchParams.get('state') !== checks.expectedState) {
        return Promise.reject(new Error('state mismatch'));
      }
      return Promise.resolve({ claims: () => ({}) });
    };
    const { app } = createTestContext({
      exchangeAuthorizationCode,
      provisionUser,
    });
    const agent = request.agent(app);
    await agent.get('/auth/google');

    const response = await agent.get(
      '/auth/google/callback?code=authorization-code&state=tampered',
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid_oidc_callback' });
    expect(provisionUser).not.toHaveBeenCalled();
  });

  it('rejects missing, expired, and replayed flow state', async () => {
    let currentTime = 0;
    const exchangeAuthorizationCode: ExchangeAuthorizationCode = () =>
      Promise.resolve({
        claims: () => ({
          sub: 'google-subject-123',
          email: 'user@example.com',
        }),
      });
    const { app, store } = createTestContext({
      exchangeAuthorizationCode,
      now: () => currentTime,
    });
    const agent = request.agent(app);

    const missing = await agent.get(
      '/auth/google/callback?code=authorization-code&state=missing',
    );
    expect(missing.status).toBe(400);

    await agent.get('/auth/google');
    const expiredFlow = readStoredFlow(store);
    currentTime = 10 * 60 * 1000 + 1;
    const expired = await agent.get(
      `/auth/google/callback?code=authorization-code&state=${expiredFlow.state}`,
    );
    expect(expired.status).toBe(400);

    currentTime = 0;
    await agent.get('/auth/google');
    const validFlow = readStoredFlow(store);
    const first = await agent.get(
      `/auth/google/callback?code=authorization-code&state=${validFlow.state}`,
    );
    expect(first.status).toBe(302);

    const replay = await agent.get(
      `/auth/google/callback?code=authorization-code&state=${validFlow.state}`,
    );
    expect(replay.status).toBe(400);
  });

  it('returns a safe error for provider and claim failures', async () => {
    const exchangeAuthorizationCode: ExchangeAuthorizationCode = () =>
      Promise.reject(new Error('provider token response with secret details'));
    const { app, store } = createTestContext({ exchangeAuthorizationCode });
    const agent = request.agent(app);
    await agent.get('/auth/google');
    const flow = readStoredFlow(store);

    const response = await agent.get(
      `/auth/google/callback?error=access_denied&state=${flow.state}`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid_oidc_callback' });
    expect(response.text).not.toContain('secret details');
  });
});
