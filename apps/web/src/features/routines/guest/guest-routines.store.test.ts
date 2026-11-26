/** Verifies that guest routine changes survive recreating the store. */
import { createRoutineInputSchema } from '@goforlift/contracts';
import { afterEach, expect, it } from 'vitest';

import { createGuestRoutinesStore } from './guest-routines.store';

afterEach(() => createGuestRoutinesStore().persist.clearStorage());

it('restores created and updated routines and keeps deleted routines removed', () => {
  const input = createRoutineInputSchema.parse({
    name: 'Upper Body',
    exercises: [{ exerciseId: crypto.randomUUID(), position: 0 }],
  });
  const store = createGuestRoutinesStore();
  const created = store.getState().createRoutine(input);
  const reopened = createGuestRoutinesStore();
  expect(reopened.getState().routines).toEqual([created]);

  const updated = reopened
    .getState()
    .updateRoutine(created.id, { ...input, name: 'Push Day' });
  expect(updated).toMatchObject({
    id: created.id,
    createdAt: created.createdAt,
    input: { name: 'Push Day' },
  });
  const afterUpdate = createGuestRoutinesStore();
  expect(afterUpdate.getState().routines).toEqual([updated]);

  afterUpdate.getState().deleteRoutine(created.id);
  const afterDelete = createGuestRoutinesStore();
  expect(afterDelete.getState().routines).toEqual([]);
  expect(
    afterDelete.getState().updateRoutine(created.id, input),
  ).toBeUndefined();
});
