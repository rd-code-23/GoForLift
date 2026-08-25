/** Verifies owner-scoped routine summary selection and serialization. */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

import { routines } from '../../db/schema/index.js';
import { listRoutinesForUser } from './routine.service.js';

describe('listRoutinesForUser', () => {
  it('returns serialized routine summaries from the owner-scoped query', async () => {
    const createdAt = new Date('2026-08-24T18:00:00.000Z');
    const updatedAt = new Date('2026-08-24T19:00:00.000Z');
    const rows = [
      {
        id: 'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
        name: 'Upper Body',
        description: null,
        exerciseCount: 3,
        scheduledDays: [5, 1, 3],
        createdAt,
        updatedAt,
      },
    ];
    const orderBy = vi.fn().mockResolvedValue(rows);
    const groupBy = vi.fn(() => ({ orderBy }));
    const where = vi.fn(() => ({ groupBy }));
    const secondLeftJoin = vi.fn(() => ({ where }));
    const firstLeftJoin = vi.fn(() => ({ leftJoin: secondLeftJoin }));
    const from = vi.fn(() => ({ leftJoin: firstLeftJoin }));
    const select = vi.fn(() => ({ from }));
    const database = { select } as unknown as NodePgDatabase;
    const userId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';

    const result = await listRoutinesForUser(database, userId);

    expect(select).toHaveBeenCalledOnce();
    expect(where).toHaveBeenCalledOnce();
    expect(result).toEqual([
      {
        ...rows[0],
        scheduledDays: [1, 3, 5],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
    expect(result[0]?.id).toBe(rows[0]?.id);
    expect(routines.userId).toBeDefined();
  });
});
