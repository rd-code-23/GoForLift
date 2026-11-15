import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ApiError,
  ensureSuccessfulResponse,
  isAuthenticationRequiredError,
  parseApiJsonResponse,
} from './api-error';

describe('API response handling', () => {
  it('preserves the response status and server error code', async () => {
    await expect(
      ensureSuccessfulResponse(
        Response.json({ error: 'exercise_not_found' }, { status: 404 }),
      ),
    ).rejects.toEqual(new ApiError(404, 'exercise_not_found'));
  });

  it('supports unsuccessful responses without JSON bodies', async () => {
    await expect(
      ensureSuccessfulResponse(new Response(null, { status: 500 })),
    ).rejects.toEqual(new ApiError(500));
  });

  it('validates successful response data with the supplied schema', async () => {
    await expect(
      parseApiJsonResponse(
        Response.json({ value: 'safe' }),
        z.object({ value: z.string() }),
      ),
    ).resolves.toEqual({ value: 'safe' });
  });

  it('identifies authentication failures', () => {
    expect(
      isAuthenticationRequiredError(
        new ApiError(401, 'authentication_required'),
      ),
    ).toBe(true);
    expect(isAuthenticationRequiredError(new ApiError(403))).toBe(false);
  });
});
