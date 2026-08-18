/** Verifies health responses, credentialed CORS, and safe middleware errors. */
import request from 'supertest';
import { Router } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp } from './app.js';

afterEach(() => vi.restoreAllMocks());

describe('GET /health', () => {
  it('reports a connected database', async () => {
    const response = await request(
      createApp({
        authRouter: Router(),
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
