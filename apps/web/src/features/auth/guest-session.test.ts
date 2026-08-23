// Verifies the temporary guest marker can be started and cleared by the welcome flow.
import { afterEach, describe, expect, it } from 'vitest';

import {
  clearGuestSession,
  isGuestSession,
  startGuestSession,
} from './guest-session';

afterEach(() => {
  sessionStorage.clear();
});

describe('guest session', () => {
  it('can clear guest mode when the welcome page loads', () => {
    expect(isGuestSession()).toBe(false);

    startGuestSession();
    expect(isGuestSession()).toBe(true);

    clearGuestSession();

    expect(isGuestSession()).toBe(false);
  });
});
