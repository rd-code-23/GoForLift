// Verifies the temporary guest marker can be started and cleared by the welcome flow.
import { afterEach, describe, expect, it } from 'vitest';

import { clearGuestSession, startGuestSession } from './guest-session';

afterEach(() => {
  sessionStorage.clear();
});

describe('guest session', () => {
  it('can clear guest mode when the welcome page loads', () => {
    startGuestSession();
    expect(sessionStorage.getItem('goforlift.guest')).toBe('true');

    clearGuestSession();

    expect(sessionStorage.getItem('goforlift.guest')).toBeNull();
  });
});
