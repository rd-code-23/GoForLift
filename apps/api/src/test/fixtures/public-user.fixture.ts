/** Creates typed public-user API test data with optional scenario overrides. */
import type { PublicUser } from '@goforlift/contracts';

export function createPublicUser(
  overrides: Partial<PublicUser> = {},
): PublicUser {
  return {
    id: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
    email: 'lifter@example.com',
    displayName: 'Go For Lifter',
    avatarUrl: null,
    ...overrides,
  };
}
