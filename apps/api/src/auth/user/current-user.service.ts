/** Loads the public profile fields exposed for the authenticated application user. */
import type { PublicUser } from '@goforlift/contracts';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { users } from '../../db/schema/index.js';

export async function findPublicUserById(
  database: NodePgDatabase,
  userId: string,
): Promise<PublicUser | null> {
  const [user] = await database
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}
