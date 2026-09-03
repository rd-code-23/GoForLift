/** Verifies authentication and response behavior for the routine list route. */
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createSessionMiddleware } from '../auth/session/session.middleware.js';
import { establishAuthenticatedTestSession } from '../../test/authenticated-session.test-helper.js';
import { testSessionConfiguration } from '../../test/fixtures/session-configuration.fixture.js';
import { InvalidRoutineExerciseSelectionError } from './routine.errors.js';
import { createRoutineRouter } from './routine.routes.js';

const userId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
const routineSummary = {
  id: 'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
  name: 'Upper Body',
  description: null,
  exerciseCount: 3,
  scheduledDays: [1, 3, 5],
  createdAt: '2026-08-24T18:00:00.000Z',
  updatedAt: '2026-08-24T19:00:00.000Z',
};
const routineList = [routineSummary];
const createRoutineInput = {
  name: 'Upper Body',
  exercises: [
    {
      exerciseId: '9f4b5a8e-2c3d-4f10-8a11-000000000001',
      position: 0,
      sets: 3,
      targetReps: 10,
      weight: 25,
      weightUnit: 'lb',
    },
  ],
};

function createTestApp(
  createRoutine = vi.fn(() => Promise.resolve(routineSummary)),
  listRoutines = vi.fn(() => Promise.resolve(routineList)),
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
  app.use('/routines', createRoutineRouter({ createRoutine, listRoutines }));

  return { app, createRoutine, listRoutines };
}

describe('POST /routines', () => {
  it('rejects anonymous and invalid requests', async () => {
    const { app, createRoutine } = createTestApp();

    const anonymous = await request(app)
      .post('/routines')
      .send(createRoutineInput);
    const invalid = await request(app)
      .post('/routines')
      .set('x-test-authenticated-user-id', userId)
      .send({ name: 'Upper Body', exercises: [] });

    expect(anonymous.status).toBe(401);
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ error: 'invalid_request' });
    expect(createRoutine).not.toHaveBeenCalled();
  });

  it('creates a routine for the authenticated user', async () => {
    const { app, createRoutine } = createTestApp();

    const response = await request(app)
      .post('/routines')
      .set('x-test-authenticated-user-id', userId)
      .send(createRoutineInput);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(routineSummary);
    expect(createRoutine).toHaveBeenCalledWith(userId, {
      ...createRoutineInput,
      exercises: [
        {
          ...createRoutineInput.exercises[0],
          restBetweenSetsSeconds: 60,
          restAfterExerciseSeconds: 0,
          notes: null,
        },
      ],
      schedules: [],
    });
  });

  it('rejects exercises unavailable to the authenticated user', async () => {
    const createRoutine = vi.fn(() =>
      Promise.reject(new InvalidRoutineExerciseSelectionError()),
    );
    const { app } = createTestApp(createRoutine);

    const response = await request(app)
      .post('/routines')
      .set('x-test-authenticated-user-id', userId)
      .send(createRoutineInput);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid_exercise_selection' });
  });
});

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
    const { app } = createTestApp(
      undefined,
      vi.fn(() => Promise.resolve([])),
    );

    const response = await request(app)
      .get('/routines')
      .set('x-test-authenticated-user-id', userId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ routines: [] });
  });
});
