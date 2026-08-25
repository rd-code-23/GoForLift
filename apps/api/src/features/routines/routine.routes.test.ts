/** Verifies authentication and response behavior for the routine list route. */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createSessionMiddleware } from '../auth/session/session.middleware.js';
import { establishAuthenticatedTestSession } from '../../test/authenticated-session.test-helper.js';
import { testSessionConfiguration } from '../../test/fixtures/session-configuration.fixture.js';
import { createRoutineRouter } from './routine.routes.js';

const userId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
const routineList = [
  {
    id: 'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
    name: 'Upper Body',
    description: null,
    exerciseCount: 3,
    scheduledDays: [1, 3, 5],
    createdAt: '2026-08-24T18:00:00.000Z',
    updatedAt: '2026-08-24T19:00:00.000Z',
  },
];

function createTestApp(
  listRoutines = vi.fn(() => Promise.resolve(routineList)),
) {
  const app = express();
  app.use(
    createSessionMiddleware(
      new session.MemoryStore(),
      testSessionConfiguration,
    ),
  );
  app.use(establishAuthenticatedTestSession());
  app.use('/routines', createRoutineRouter({ listRoutines }));

  return { app, listRoutines };
}

describe('GET /routines', () => {
  it('rejects anonymous requests', async () => {
    const { app, listRoutines } = createTestApp();

    const response = await request(app).get('/routines');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'authentication_required' });
    expect(listRoutines).not.toHaveBeenCalled();
  });

  it('returns routine summaries for the authenticated user', async () => {
    const { app, listRoutines } = createTestApp();

    const response = await request(app)
      .get('/routines')
      .set('x-test-authenticated-user-id', userId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ routines: routineList });
    expect(listRoutines).toHaveBeenCalledWith(userId);
  });

  it('returns an empty list for a user without routines', async () => {
    const { app } = createTestApp(vi.fn(() => Promise.resolve([])));

    const response = await request(app)
      .get('/routines')
      .set('x-test-authenticated-user-id', userId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ routines: [] });
  });
});
