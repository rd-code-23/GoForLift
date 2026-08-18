/** Verifies opaque cookies and valid, missing, unknown, and expired sessions. */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createSessionMiddleware } from './session.js';

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

function createSessionTestApp(store: session.MemoryStore) {
  const app = express();
  app.use(createSessionMiddleware(store, sessionConfiguration));

  app.post('/session', (request, response) => {
    request.session.userId = 'user-123';
    response.sendStatus(204);
  });

  app.get('/session', (request, response) => {
    response.json({ userId: request.session.userId ?? null });
  });

  return app;
}

function clearStore(store: session.MemoryStore) {
  return new Promise<void>((resolve, reject) => {
    store.clear((error) =>
      error
        ? reject(
            error instanceof Error
              ? error
              : new Error('Failed to clear test session store'),
          )
        : resolve(),
    );
  });
}

function inspectStoredSessions(store: session.MemoryStore) {
  return (store as unknown as { sessions: Record<string, string> }).sessions;
}

describe('session middleware', () => {
  it('does not create a session for an anonymous request', async () => {
    const response = await request(
      createSessionTestApp(new session.MemoryStore()),
    ).get('/session');

    expect(response.body).toEqual({ userId: null });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('resolves a valid session from an opaque cookie', async () => {
    const agent = request.agent(
      createSessionTestApp(new session.MemoryStore()),
    );
    const creationResponse = await agent.post('/session');
    const cookie = creationResponse.headers['set-cookie']?.[0];

    expect(cookie).toContain('goforlift.sid=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('user-123');

    const response = await agent.get('/session');
    expect(response.body).toEqual({ userId: 'user-123' });
  });

  it('treats an unknown session as anonymous', async () => {
    const store = new session.MemoryStore();
    const agent = request.agent(createSessionTestApp(store));
    await agent.post('/session');
    await clearStore(store);

    const response = await agent.get('/session');
    expect(response.body).toEqual({ userId: null });
  });

  it('treats an expired session as anonymous', async () => {
    const store = new session.MemoryStore();
    const agent = request.agent(createSessionTestApp(store));
    await agent.post('/session');

    const storedSessions = inspectStoredSessions(store);
    for (const sessionId of Object.keys(storedSessions)) {
      const storedSession = JSON.parse(storedSessions[sessionId] ?? '{}') as {
        cookie?: { expires?: string };
      };
      if (storedSession.cookie) {
        storedSession.cookie.expires = new Date(0).toISOString();
      }
      storedSessions[sessionId] = JSON.stringify(storedSession);
    }

    const response = await agent.get('/session');
    expect(response.body).toEqual({ userId: null });
  });
});
