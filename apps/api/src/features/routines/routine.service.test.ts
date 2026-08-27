/** Verifies owner-scoped routine summary selection and serialization. */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { describe, expect, it, vi } from 'vitest';

import {
  routineExercises,
  routineSchedules,
  routines,
} from '../../db/schema/index.js';
import { InvalidRoutineExerciseSelectionError } from './routine.errors.js';
import {
  createRoutineForUser,
  listRoutinesForUser,
} from './routine.service.js';

const userId = '26d34dc0-8e4c-4bd0-9e3b-7b839b44e486';
const exerciseId = '9f4b5a8e-2c3d-4f10-8a11-000000000001';

describe('createRoutineForUser', () => {
  it('creates the routine, exercises, and schedules in one transaction', async () => {
    const createdAt = new Date('2026-08-24T18:00:00.000Z');
    const updatedAt = new Date('2026-08-24T19:00:00.000Z');
    const createdRoutine = {
      id: 'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
      name: 'Upper Body',
      description: null,
      createdAt,
      updatedAt,
    };
    const returning = vi.fn().mockResolvedValue([createdRoutine]);
    const routineValues = vi.fn(() => ({ returning }));
    const exerciseValues = vi.fn().mockResolvedValue(undefined);
    const scheduleValues = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn((table) => {
      if (table === routines) return { values: routineValues };
      if (table === routineExercises) return { values: exerciseValues };
      if (table === routineSchedules) return { values: scheduleValues };
      throw new Error('Unexpected table.');
    });
    const where = vi.fn().mockResolvedValue([{ id: exerciseId }]);
    const transaction = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where })),
      })),
      insert,
    };
    const database = {
      transaction: vi.fn(
        async <Result>(
          callback: (activeTransaction: typeof transaction) => Promise<Result>,
        ) => callback(transaction),
      ),
    } as unknown as NodePgDatabase;

    const result = await createRoutineForUser(database, userId, {
      name: createdRoutine.name,
      exercises: [
        {
          exerciseId,
          position: 0,
          sets: 3,
          targetReps: 10,
          weight: 25,
          weightUnit: 'lb',
          restBetweenSetsSeconds: 60,
          restAfterExerciseSeconds: 90,
        },
      ],
      schedules: [{ dayOfWeek: 3, localTime: '18:30:00' }],
    });

    expect(routineValues).toHaveBeenCalledWith({
      userId,
      name: createdRoutine.name,
      description: null,
    });
    expect(exerciseValues).toHaveBeenCalledWith([
      expect.objectContaining({
        routineId: createdRoutine.id,
        exerciseId,
        weight: '25',
      }),
    ]);
    expect(scheduleValues).toHaveBeenCalledWith([
      {
        routineId: createdRoutine.id,
        dayOfWeek: 3,
        localTime: '18:30:00',
      },
    ]);
    expect(result).toEqual({
      id: createdRoutine.id,
      name: createdRoutine.name,
      description: null,
      exerciseCount: 1,
      scheduledDays: [3],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('rejects unavailable exercises before inserting a routine', async () => {
    const insert = vi.fn();
    const transaction = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      })),
      insert,
    };
    const database = {
      transaction: vi.fn(
        async <Result>(
          callback: (activeTransaction: typeof transaction) => Promise<Result>,
        ) => callback(transaction),
      ),
    } as unknown as NodePgDatabase;

    await expect(
      createRoutineForUser(database, userId, {
        name: 'Upper Body',
        exercises: [
          {
            exerciseId,
            position: 0,
            sets: 3,
            targetReps: 10,
            weight: 25,
            weightUnit: 'lb',
            restBetweenSetsSeconds: 0,
            restAfterExerciseSeconds: 0,
          },
        ],
        schedules: [],
      }),
    ).rejects.toBeInstanceOf(InvalidRoutineExerciseSelectionError);
    expect(insert).not.toHaveBeenCalled();
  });
});

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
