/** Verifies that exercise listing applies ownership visibility rules. */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

import { exercises } from '../../db/schema/index.js';
import { listExercisesForUser } from './exercise.service.js';

describe('listExercisesForUser', () => {
  it('selects the safe projection and identifies custom exercises', async () => {
    const builtInExercise = {
      id: 'bde77251-e433-4f39-b1cb-41a2f2ad5462',
      name: 'Bench Press',
      description: null,
      ownerUserId: null,
    };
    const customExercise = {
      id: 'f29f209d-d1f9-4988-b693-69b291917b0f',
      name: 'Custom Carry',
      description: 'A custom loaded carry.',
      ownerUserId: '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
    };
    const rows = [builtInExercise, customExercise];
    const orderBy = vi.fn().mockResolvedValue(rows);
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const database = { select } as unknown as NodePgDatabase;

    const result = await listExercisesForUser(
      database,
      '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486',
    );

    expect(select).toHaveBeenCalledWith({
      id: exercises.id,
      name: exercises.name,
      description: exercises.description,
      ownerUserId: exercises.ownerUserId,
    });
    expect(where).toHaveBeenCalledOnce();
    expect(result).toEqual([
      {
        id: builtInExercise.id,
        name: builtInExercise.name,
        description: builtInExercise.description,
        isCustom: false,
      },
      {
        id: customExercise.id,
        name: customExercise.name,
        description: customExercise.description,
        isCustom: true,
      },
    ]);
  });
});
