/** Verifies that current-user lookup selects only the public profile projection. */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

import { users } from '../../db/schema/index.js';
import { createPublicUser } from '../../test/fixtures/public-user.fixture.js';
import { findPublicUserById } from './current-user.service.js';

describe('findPublicUserById', () => {
  it('returns the public user projection', async () => {
    const publicUser = createPublicUser();
    const limit = vi.fn().mockResolvedValue([publicUser]);
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const database = { select } as unknown as NodePgDatabase;

    const result = await findPublicUserById(database, publicUser.id);

    expect(select).toHaveBeenCalledWith({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    });
    expect(result).toEqual(publicUser);
  });

  it('returns null when the session user no longer exists', async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const database = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit })),
        })),
      })),
    } as unknown as NodePgDatabase;

    await expect(
      findPublicUserById(database, 'missing-user'),
    ).resolves.toBeNull();
  });
});
