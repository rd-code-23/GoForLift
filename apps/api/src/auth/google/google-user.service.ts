/** Atomically provisions or updates a user identified by Google's stable subject. */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { users } from '../../db/schema/index.js';

export type GoogleUserProfile = {
  avatarUrl?: string;
  displayName?: string;
  email: string;
  subject: string;
};

export async function provisionGoogleUser(
  database: NodePgDatabase,
  profile: GoogleUserProfile,
) {
  const [user] = await database
    .insert(users)
    .values({
      email: profile.email,
      displayName: profile.displayName ?? null,
      avatarUrl: profile.avatarUrl ?? null,
      authProvider: 'google',
      authProviderSubject: profile.subject,
    })
    .onConflictDoUpdate({
      target: [users.authProvider, users.authProviderSubject],
      set: {
        email: profile.email,
        displayName: profile.displayName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id });

  if (!user) {
    throw new Error('Google user provisioning returned no user');
  }

  return user;
}
