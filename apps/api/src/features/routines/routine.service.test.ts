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
  deleteRoutineForUser,
  getRoutineForUser,
  listRoutinesForUser,
  updateRoutineForUser,
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
          notes: null,
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
            notes: null,
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

describe('getRoutineForUser', () => {
  it('returns the owner-scoped routine with ordered exercises and schedules', async () => {
    const routineId = 'c38794ef-9a4a-40d8-8cdc-7f7416a53120';
    const createdAt = new Date('2026-08-24T18:00:00.000Z');
    const updatedAt = new Date('2026-08-24T19:00:00.000Z');
    const ownedRoutine = {
      id: routineId,
      name: 'Upper Body',
      description: null,
      createdAt,
      updatedAt,
    };
    const exerciseRows = [
      {
        exerciseId,
        name: 'Bench Press',
        description: null,
        position: 0,
        sets: 3,
        targetReps: 10,
        weight: '25.00',
        weightUnit: 'lb',
        restBetweenSetsSeconds: 60,
        restAfterExerciseSeconds: 0,
        notes: null,
      },
    ];
    const scheduleRows = [{ dayOfWeek: 1, localTime: '18:30:00' }];
    const ownerLimit = vi.fn().mockResolvedValue([ownedRoutine]);
    const ownerWhere = vi.fn(() => ({ limit: ownerLimit }));
    const exerciseOrderBy = vi.fn().mockResolvedValue(exerciseRows);
    const exerciseWhere = vi.fn(() => ({ orderBy: exerciseOrderBy }));
    const exerciseInnerJoin = vi.fn(() => ({ where: exerciseWhere }));
    const scheduleOrderBy = vi.fn().mockResolvedValue(scheduleRows);
    const scheduleWhere = vi.fn(() => ({ orderBy: scheduleOrderBy }));
    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn(() => ({ where: ownerWhere })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({ innerJoin: exerciseInnerJoin })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({ where: scheduleWhere })),
      });
    const database = { select } as unknown as NodePgDatabase;

    const result = await getRoutineForUser(database, userId, routineId);

    expect(ownerWhere).toHaveBeenCalledOnce();
    expect(result).toEqual({
      ...ownedRoutine,
      exercises: [{ ...exerciseRows[0], weight: 25 }],
      schedules: scheduleRows,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('does not load child data when the routine is not owned', async () => {
    const select = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })),
      })),
    }));
    const database = { select } as unknown as NodePgDatabase;

    const result = await getRoutineForUser(
      database,
      userId,
      'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
    );

    expect(result).toBeNull();
    expect(select).toHaveBeenCalledOnce();
  });
});

describe('updateRoutineForUser', () => {
  it('replaces routine details, exercises, and schedules in one transaction', async () => {
    const routineId = 'c38794ef-9a4a-40d8-8cdc-7f7416a53120';
    const createdAt = new Date('2026-08-24T18:00:00.000Z');
    const updatedAt = new Date('2026-08-25T19:00:00.000Z');
    const updatedRoutine = {
      id: routineId,
      name: 'Updated Upper Body',
      description: 'Updated plan',
      createdAt,
      updatedAt,
    };
    const returning = vi.fn().mockResolvedValue([updatedRoutine]);
    const updateWhere = vi.fn(() => ({ returning }));
    const set = vi.fn(
      (values: {
        name: string;
        description: string | null;
        updatedAt: Date;
      }) => {
        void values;
        return { where: updateWhere };
      },
    );
    const availableWhere = vi.fn().mockResolvedValue([{ id: exerciseId }]);
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const exerciseValues = vi.fn().mockResolvedValue(undefined);
    const scheduleValues = vi.fn().mockResolvedValue(undefined);
    const transaction = {
      update: vi.fn(() => ({ set })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: availableWhere })),
      })),
      delete: vi.fn(() => ({ where: deleteWhere })),
      insert: vi.fn((table) => {
        if (table === routineExercises) return { values: exerciseValues };
        if (table === routineSchedules) return { values: scheduleValues };
        throw new Error('Unexpected table.');
      }),
    };
    const database = {
      transaction: vi.fn(
        async <Result>(
          callback: (activeTransaction: typeof transaction) => Promise<Result>,
        ) => callback(transaction),
      ),
    } as unknown as NodePgDatabase;
    const input = {
      name: updatedRoutine.name,
      description: updatedRoutine.description,
      exercises: [
        {
          exerciseId,
          position: 0,
          sets: 4,
          targetReps: 8,
          weight: 30,
          weightUnit: 'lb' as const,
          restBetweenSetsSeconds: 75,
          restAfterExerciseSeconds: 90,
          notes: 'Controlled tempo',
        },
      ],
      schedules: [{ dayOfWeek: 2, localTime: '18:30:00' }],
    };

    const result = await updateRoutineForUser(
      database,
      userId,
      routineId,
      input,
    );

    const updateValues = set.mock.calls[0]?.[0];
    expect(updateValues?.name).toBe(input.name);
    expect(updateValues?.description).toBe(input.description);
    expect(updateValues?.updatedAt).toBeInstanceOf(Date);
    expect(deleteWhere).toHaveBeenCalledTimes(2);
    expect(exerciseValues).toHaveBeenCalledWith([
      expect.objectContaining({
        routineId,
        exerciseId,
        weight: '30',
      }),
    ]);
    expect(scheduleValues).toHaveBeenCalledWith([
      { routineId, dayOfWeek: 2, localTime: '18:30:00' },
    ]);
    expect(result).toEqual({
      id: routineId,
      name: input.name,
      description: input.description,
      exerciseCount: 1,
      scheduledDays: [2],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('stops before replacing children when the routine is not owned', async () => {
    const deleteRows = vi.fn();
    const insert = vi.fn();
    const transaction = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      select: vi.fn(),
      delete: deleteRows,
      insert,
    };
    const database = {
      transaction: vi.fn(
        async <Result>(
          callback: (activeTransaction: typeof transaction) => Promise<Result>,
        ) => callback(transaction),
      ),
    } as unknown as NodePgDatabase;

    const result = await updateRoutineForUser(database, userId, exerciseId, {
      name: 'Updated Routine',
      exercises: [
        {
          exerciseId,
          position: 0,
          sets: 3,
          targetReps: 8,
          weight: 10,
          weightUnit: 'lb',
          restBetweenSetsSeconds: 60,
          restAfterExerciseSeconds: 0,
          notes: null,
        },
      ],
      schedules: [],
    });

    expect(result).toBeNull();
    expect(transaction.select).not.toHaveBeenCalled();
    expect(deleteRows).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects unavailable exercises before replacing child rows', async () => {
    const updatedRoutine = {
      id: exerciseId,
      name: 'Updated Routine',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const deleteRows = vi.fn();
    const insert = vi.fn();
    const transaction = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([updatedRoutine]),
          })),
        })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      })),
      delete: deleteRows,
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
      updateRoutineForUser(database, userId, updatedRoutine.id, {
        name: updatedRoutine.name,
        exercises: [
          {
            exerciseId,
            position: 0,
            sets: 3,
            targetReps: 8,
            weight: 10,
            weightUnit: 'lb',
            restBetweenSetsSeconds: 60,
            restAfterExerciseSeconds: 0,
            notes: null,
          },
        ],
        schedules: [],
      }),
    ).rejects.toBeInstanceOf(InvalidRoutineExerciseSelectionError);
    expect(deleteRows).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});

describe('deleteRoutineForUser', () => {
  it('deletes only an owner-matched routine', async () => {
    const returning = vi
      .fn()
      .mockResolvedValue([{ id: 'c38794ef-9a4a-40d8-8cdc-7f7416a53120' }]);
    const where = vi.fn(() => ({ returning }));
    const database = {
      delete: vi.fn(() => ({ where })),
    } as unknown as NodePgDatabase;

    await expect(
      deleteRoutineForUser(
        database,
        userId,
        'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
      ),
    ).resolves.toBe(true);
    expect(where).toHaveBeenCalledOnce();
  });

  it('reports when no owner-matched routine was deleted', async () => {
    const database = {
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
    } as unknown as NodePgDatabase;

    await expect(
      deleteRoutineForUser(
        database,
        userId,
        'c38794ef-9a4a-40d8-8cdc-7f7416a53120',
      ),
    ).resolves.toBe(false);
  });
});
