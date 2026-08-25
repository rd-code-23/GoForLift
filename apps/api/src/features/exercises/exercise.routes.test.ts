/** Verifies authentication and response behavior for the exercise list route. */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createSessionMiddleware } from '../auth/session/session.middleware.js';
import { establishAuthenticatedTestSession } from '../../test/authenticated-session.test-helper.js';
import { testSessionConfiguration } from '../../test/fixtures/session-configuration.fixture.js';
import { createExerciseRouter } from './exercise.routes.js';

const userId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
const exerciseList = [
  {
    id: 'bde77251-e433-4f39-b1cb-41a2f2ad5462',
    name: 'Bench Press',
    description: 'Press a barbell from chest level.',
    isCustom: false,
  },
  {
    id: 'f29f209d-d1f9-4988-b693-69b291917b0f',
    name: 'Custom Carry',
    description: null,
    isCustom: true,
  },
];

function createTestApp(
  listExercises = vi.fn(() => Promise.resolve(exerciseList)),
) {
  const app = express();
  app.use(
    createSessionMiddleware(
      new session.MemoryStore(),
      testSessionConfiguration,
    ),
  );
  app.use(establishAuthenticatedTestSession());
  app.use('/exercises', createExerciseRouter({ listExercises }));

  return { app, listExercises };
}

describe('GET /exercises', () => {
  it('rejects anonymous requests', async () => {
    const { app, listExercises } = createTestApp();

    const response = await request(app).get('/exercises');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'authentication_required' });
    expect(listExercises).not.toHaveBeenCalled();
  });

  it('returns exercises visible to the authenticated user', async () => {
    const { app, listExercises } = createTestApp();

    const response = await request(app)
      .get('/exercises')
      .set('x-test-authenticated-user-id', userId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ exercises: exerciseList });
    expect(listExercises).toHaveBeenCalledWith(userId);
  });
});
