/** Verifies atomic Google-subject user provisioning and profile updates. */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

import { provisionGoogleUser } from './google-user.service.js';

function createDatabaseResult(rows: Array<{ id: string }>) {
  const returning = vi.fn(() => Promise.resolve(rows));
  const onConflictDoUpdate = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));

  return {
    database: { insert } as unknown as NodePgDatabase,
    insert,
    onConflictDoUpdate,
    returning,
    values,
  };
}

describe('provisionGoogleUser', () => {
  it('inserts or updates one user by the stable Google subject', async () => {
    const database = createDatabaseResult([{ id: 'user-123' }]);
    const profile = {
      subject: 'google-subject-123',
      email: 'user@example.com',
      displayName: 'Go For Lifter',
      avatarUrl: 'https://images.example.com/avatar.png',
    };

    await expect(
      provisionGoogleUser(database.database, profile),
    ).resolves.toEqual({ id: 'user-123' });
    expect(database.values).toHaveBeenCalledWith({
      authProvider: 'google',
      authProviderSubject: 'google-subject-123',
      email: 'user@example.com',
      displayName: 'Go For Lifter',
      avatarUrl: 'https://images.example.com/avatar.png',
    });
    expect(database.onConflictDoUpdate).toHaveBeenCalledOnce();
    expect(database.returning).toHaveBeenCalledOnce();
  });

  it('fails closed when PostgreSQL returns no provisioned user', async () => {
    const database = createDatabaseResult([]);

    await expect(
      provisionGoogleUser(database.database, {
        subject: 'google-subject-123',
        email: 'user@example.com',
      }),
    ).rejects.toThrow('Google user provisioning returned no user');
    expect(database.values).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: null, avatarUrl: null }),
    );
  });
});
