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
const builtInExercise = {
  id: 'bde77251-e433-4f39-b1cb-41a2f2ad5462',
  name: 'Bench Press',
  description: 'Press a barbell from chest level.',
  isCustom: false,
};
const customExercise = {
  id: 'f29f209d-d1f9-4988-b693-69b291917b0f',
  name: 'Custom Carry',
  description: null,
  isCustom: true,
};
const exerciseList = [builtInExercise, customExercise];

function createTestApp(
  createExercise = vi.fn(() => Promise.resolve(customExercise)),
  listExercises = vi.fn(() => Promise.resolve(exerciseList)),
) {
  const app = express();
  app.use(express.json());
  app.use(
    createSessionMiddleware(
      new session.MemoryStore(),
      testSessionConfiguration,
    ),
  );
  app.use(establishAuthenticatedTestSession());
  app.use(
    '/exercises',
    createExerciseRouter({ createExercise, listExercises }),
  );

  return { app, createExercise, listExercises };
}

describe('POST /exercises', () => {
  it('rejects anonymous requests', async () => {
    const { app, createExercise } = createTestApp();

    const response = await request(app)
      .post('/exercises')
      .send({ name: 'Custom Carry' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'authentication_required' });
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('rejects invalid input and client-controlled ownership', async () => {
    const { app, createExercise } = createTestApp();

    const emptyName = await request(app)
      .post('/exercises')
      .set('x-test-authenticated-user-id', userId)
      .send({ name: '   ' });
    const suppliedOwner = await request(app)
      .post('/exercises')
      .set('x-test-authenticated-user-id', userId)
      .send({ name: 'Custom Carry', ownerUserId: userId });

    expect(emptyName.status).toBe(400);
    expect(emptyName.body).toEqual({ error: 'invalid_request' });
    expect(suppliedOwner.status).toBe(400);
    expect(suppliedOwner.body).toEqual({ error: 'invalid_request' });
    expect(createExercise).not.toHaveBeenCalled();
  });

  it('creates an exercise owned by the authenticated user', async () => {
    const { app, createExercise } = createTestApp();

    const response = await request(app)
      .post('/exercises')
      .set('x-test-authenticated-user-id', userId)
      .send({
        name: '  Custom Carry  ',
        description: '  A custom loaded carry.  ',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(customExercise);
    expect(createExercise).toHaveBeenCalledWith(userId, {
      name: 'Custom Carry',
      description: 'A custom loaded carry.',
    });
  });
});

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
