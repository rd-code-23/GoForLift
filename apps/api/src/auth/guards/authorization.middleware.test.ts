/** Verifies authentication and ownership authorization through protected HTTP behavior. */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createSessionMiddleware } from '../session/session.middleware.js';
import {
  establishAuthenticatedTestSession,
  withAuthenticatedTestUser,
} from '../../test/authenticated-session.test-helper.js';
import {
  getAuthenticatedUserId,
  requireAuthentication,
} from './authentication.middleware.js';
import { requireAuthorization } from './authorization.middleware.js';

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

function createProtectedTestApp(
  userOwnsResource: (resourceId: string, userId: string) => Promise<boolean>,
) {
  const app = express();
  app.use(
    createSessionMiddleware(new session.MemoryStore(), sessionConfiguration),
  );
  app.use(establishAuthenticatedTestSession());
  app.get(
    '/protected/:resourceId',
    requireAuthentication,
    requireAuthorization((authenticatedRequest) => {
      const resourceId = authenticatedRequest.params.resourceId;
      return (
        typeof resourceId === 'string' &&
        userOwnsResource(resourceId, authenticatedRequest.session.userId)
      );
    }),
    (authenticatedRequest, response) => {
      response.status(200).json({
        resourceId: authenticatedRequest.params.resourceId,
        userId: getAuthenticatedUserId(authenticatedRequest),
      });
    },
  );

  return app;
}

describe('authentication and authorization guards', () => {
  it('returns 401 when a protected request has no authenticated session', async () => {
    const userOwnsResource = vi.fn(() => Promise.resolve(true));
    const app = createProtectedTestApp(userOwnsResource);

    const response = await request(app).get('/protected/routine-123');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'authentication_required' });
    expect(userOwnsResource).not.toHaveBeenCalled();
  });

  it('uses the session user ID for an allowed ownership check', async () => {
    const userOwnsResource = vi.fn(() => Promise.resolve(true));
    const app = createProtectedTestApp(userOwnsResource);

    const response = await request(app)
      .get('/protected/routine-123')
      .set(withAuthenticatedTestUser('owner-123'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      resourceId: 'routine-123',
      userId: 'owner-123',
    });
    expect(userOwnsResource).toHaveBeenCalledWith('routine-123', 'owner-123');
  });

  it('returns 403 for authenticated cross-user access', async () => {
    const userOwnsResource = vi.fn((_resourceId, userId) =>
      Promise.resolve(userId === 'owner-123'),
    );
    const app = createProtectedTestApp(userOwnsResource);

    const response = await request(app)
      .get('/protected/routine-123')
      .set(withAuthenticatedTestUser('different-user'));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'forbidden' });
  });

  it('does not let client-provided ownership override the session identity', async () => {
    const userOwnsResource = vi.fn((_resourceId, userId) =>
      Promise.resolve(userId === 'owner-123'),
    );
    const app = createProtectedTestApp(userOwnsResource);

    const response = await request(app)
      .get('/protected/routine-123?userId=owner-123')
      .set(withAuthenticatedTestUser('attacker-456'));

    expect(response.status).toBe(403);
    expect(userOwnsResource).toHaveBeenCalledWith(
      'routine-123',
      'attacker-456',
    );
  });

  it('fails closed when ownership cannot be established', async () => {
    const app = createProtectedTestApp(() => Promise.resolve(false));

    const response = await request(app)
      .get('/protected/missing-resource')
      .set(withAuthenticatedTestUser('owner-123'));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'forbidden' });
  });
});
