/** Verifies API failures are translated without exposing backend details. */
import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';
import { getApiErrorMessage } from './api-error-message';

describe('API error messages', () => {
  it('uses a shared message for application-wide error codes', () => {
    expect(
      getApiErrorMessage(
        new ApiError(403, 'invalid_csrf_token'),
        'The request failed.',
      ),
    ).toBe(
      'Your session could not be verified. Refresh the page and try again.',
    );
  });

  it('allows a feature to explain a domain-specific error code', () => {
    expect(
      getApiErrorMessage(
        new ApiError(400, 'invalid_exercise_selection'),
        "We couldn't save your routine. Try again.",
        {
          invalid_exercise_selection:
            'One or more exercises are no longer available.',
        },
      ),
    ).toBe('One or more exercises are no longer available.');
  });

  it('uses the safe feature fallback for unknown failures', () => {
    expect(
      getApiErrorMessage(
        new ApiError(500, 'database_connection_failed'),
        "We couldn't save your routine. Try again.",
      ),
    ).toBe("We couldn't save your routine. Try again.");
    expect(
      getApiErrorMessage(
        new TypeError('Failed to fetch'),
        "We couldn't save your routine. Try again.",
      ),
    ).toBe("We couldn't save your routine. Try again.");
  });

  it('explains when the user should wait before retrying', () => {
    expect(getApiErrorMessage(new ApiError(429), 'The request failed.')).toBe(
      'Too many requests. Wait a moment and try again.',
    );
  });
});
