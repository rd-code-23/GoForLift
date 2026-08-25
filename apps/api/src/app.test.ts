/** Verifies health responses, credentialed CORS, and safe middleware errors. */
import request from 'supertest';
import { Router } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from './app.js';

const noOpMiddleware = ((_request, _response, next) =>
  next()) satisfies import('express').RequestHandler;
const noOpErrorMiddleware = ((error, _request, _response, next) =>
  next(error)) satisfies import('express').ErrorRequestHandler;

afterEach(() => vi.restoreAllMocks());

describe('GET /health', () => {
  it('reports a connected database', async () => {
    const response = await request(
      createApp({
        authRouter: Router(),
        exerciseRouter: Router(),
        routineRouter: Router(),
        csrfErrorHandler: noOpErrorMiddleware,
        csrfProtection: noOpMiddleware,
        webOrigin: 'http://localhost:5173',
        trustProxyHops: 0,
        sessionMiddleware: (_request, _response, next) => next(),
        checkDatabaseConnection: vi.fn().mockResolvedValue(undefined),
      }),
    ).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('returns a safe unavailable response when the database cannot be reached', async () => {
    const response = await request(
      createApp({
        authRouter: Router(),
        exerciseRouter: Router(),
        routineRouter: Router(),
        csrfErrorHandler: noOpErrorMiddleware,
        csrfProtection: noOpMiddleware,
        webOrigin: 'http://localhost:5173',
        trustProxyHops: 0,
        sessionMiddleware: (_request, _response, next) => next(),
        checkDatabaseConnection: vi
          .fn()
          .mockRejectedValue(new Error('connection failed')),
      }),
    ).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'unavailable',
      database: 'unavailable',
    });
  });

  it('allows credentialed requests only from the configured web origin', async () => {
    const response = await request(
      createApp({
        authRouter: Router(),
        exerciseRouter: Router(),
        routineRouter: Router(),
        csrfErrorHandler: noOpErrorMiddleware,
        csrfProtection: noOpMiddleware,
        webOrigin: 'http://localhost:5173',
        trustProxyHops: 0,
        sessionMiddleware: (_request, _response, next) => next(),
        checkDatabaseConnection: vi.fn().mockResolvedValue(undefined),
      }),
    )
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('returns a safe response when session middleware fails', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(
      createApp({
        authRouter: Router(),
        exerciseRouter: Router(),
        routineRouter: Router(),
        csrfErrorHandler: noOpErrorMiddleware,
        csrfProtection: noOpMiddleware,
        webOrigin: 'http://localhost:5173',
        trustProxyHops: 0,
        sessionMiddleware: (_request, _response, next) =>
          next(new Error('database connection details')),
        checkDatabaseConnection: vi.fn().mockResolvedValue(undefined),
      }),
    ).get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'internal_server_error' });
    expect(response.text).not.toContain('database connection details');
    expect(errorLog).toHaveBeenCalledWith('API request failed');
  });
});

describe('JSON request parsing', () => {
  function createTestApp() {
    return createApp({
      authRouter: Router(),
      exerciseRouter: Router(),
      routineRouter: Router(),
      csrfErrorHandler: noOpErrorMiddleware,
      csrfProtection: noOpMiddleware,
      webOrigin: 'http://localhost:5173',
      trustProxyHops: 0,
      sessionMiddleware: noOpMiddleware,
      checkDatabaseConnection: vi.fn().mockResolvedValue(undefined),
    });
  }

  it('returns a client error for malformed JSON', async () => {
    const response = await request(createTestApp())
      .post('/exercises')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid_json' });
  });

  it('rejects JSON bodies larger than the configured limit', async () => {
    const response = await request(createTestApp())
      .post('/exercises')
      .send({ description: 'a'.repeat(101 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ error: 'request_too_large' });
  });
});
