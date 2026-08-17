import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from './app.js';

describe('GET /health', () => {
  it('reports a connected database', async () => {
    const response = await request(
      createApp({
        webOrigin: 'http://localhost:5173',
        checkDatabaseConnection: vi.fn().mockResolvedValue(undefined),
      }),
    ).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('returns a safe unavailable response when the database cannot be reached', async () => {
    const response = await request(
      createApp({
        webOrigin: 'http://localhost:5173',
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
});
