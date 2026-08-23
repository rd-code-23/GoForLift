/** Verifies auth hydration, session-bound CSRF protection, and logout behavior. */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createPublicUser } from '../../test/fixtures/public-user.fixture.js';
import { testSessionConfiguration } from '../../test/fixtures/session-configuration.fixture.js';
import { csrfErrorHandler, csrfProtection } from '../csrf/csrf.middleware.js';
import { createSessionMiddleware } from './session.middleware.js';
import { createSessionRouter } from './session.routes.js';

const publicUser = createPublicUser({
  avatarUrl: 'https://images.example.com/avatar.png',
});

const csrfTokenResponseSchema = z.object({ csrfToken: z.string() });

function createTestContext(
  findPublicUser = vi.fn(() => Promise.resolve(publicUser)),
) {
  const store = new session.MemoryStore();
  const app = express();
  app.use(createSessionMiddleware(store, testSessionConfiguration));
  app.use((request, _response, next) => {
    const testUserId = request.header('x-test-user-id');
    if (testUserId) {
      request.session.userId = testUserId;
    }
    next();
  });
  app.use(csrfProtection);
  app.use(
    '/auth',
    createSessionRouter({
      cookieName: testSessionConfiguration.SESSION_COOKIE.name,
      cookiePath: testSessionConfiguration.SESSION_COOKIE.path,
      findPublicUser,
    }),
  );
  app.use(csrfErrorHandler);

  return { app, findPublicUser, store };
}

async function getCsrfToken(agent: ReturnType<typeof request.agent>) {
  const response = await agent.get('/auth/csrf-token');
  return csrfTokenResponseSchema.parse(response.body as unknown).csrfToken;
}

describe('GET /auth/me', () => {
  it('returns an anonymous state without creating a session', async () => {
    const { app, findPublicUser } = createTestContext();

    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: null });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(findPublicUser).not.toHaveBeenCalled();
  });

  it('returns only the authenticated user public profile', async () => {
    const { app, findPublicUser } = createTestContext();

    const response = await request(app)
      .get('/auth/me')
      .set('x-test-user-id', publicUser.id);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: publicUser });
    expect(findPublicUser).toHaveBeenCalledWith(publicUser.id);
    expect(response.text).not.toContain('authProvider');
    expect(response.text).not.toContain('csrfToken');
  });
});

describe('GET /auth/csrf-token', () => {
  it('binds different tokens to different server-side sessions', async () => {
    const { app } = createTestContext();
    const firstAgent = request.agent(app);
    const secondAgent = request.agent(app);

    const firstToken = await getCsrfToken(firstAgent);
    const secondToken = await getCsrfToken(secondAgent);

    expect(firstToken).toBeTruthy();
    expect(secondToken).toBeTruthy();
    expect(firstToken).not.toBe(secondToken);

    const crossSessionLogout = await secondAgent
      .post('/auth/logout')
      .set('x-csrf-token', firstToken);
    expect(crossSessionLogout.status).toBe(403);
    expect(crossSessionLogout.body).toEqual({
      error: 'invalid_csrf_token',
    });
  });
});

describe('POST /auth/logout', () => {
  it('rejects missing and invalid CSRF tokens', async () => {
    const { app } = createTestContext();
    const agent = request.agent(app);
    await getCsrfToken(agent);

    const missing = await agent.post('/auth/logout');
    const invalid = await agent
      .post('/auth/logout')
      .set('x-csrf-token', 'invalid-token');

    expect(missing.status).toBe(403);
    expect(invalid.status).toBe(403);
  });

  it('destroys the session, clears the cookie, and prevents reuse', async () => {
    const { app, store } = createTestContext();
    const agent = request.agent(app);
    await agent.get('/auth/me').set('x-test-user-id', publicUser.id);
    const csrfToken = await getCsrfToken(agent);

    const logout = await agent
      .post('/auth/logout')
      .set('x-csrf-token', csrfToken);
    const afterLogout = await agent.get('/auth/me');

    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie']?.[0]).toContain('goforlift.sid=;');
    expect(afterLogout.body).toEqual({ user: null });
    const storedSessions = (
      store as unknown as { sessions: Record<string, string> }
    ).sessions;
    expect(Object.keys(storedSessions)).toHaveLength(0);
  });

  it('is idempotent when repeated with a fresh session-bound token', async () => {
    const { app } = createTestContext();
    const agent = request.agent(app);

    const firstToken = await getCsrfToken(agent);
    const firstLogout = await agent
      .post('/auth/logout')
      .set('x-csrf-token', firstToken);
    const secondToken = await getCsrfToken(agent);
    const secondLogout = await agent
      .post('/auth/logout')
      .set('x-csrf-token', secondToken);

    expect(firstLogout.status).toBe(204);
    expect(secondLogout.status).toBe(204);
  });
});
