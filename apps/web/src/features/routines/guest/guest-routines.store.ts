/** Stores guest routines in the browser across visits. */
import {
  createRoutineInputSchema,
  type CreateRoutineInput,
} from '@goforlift/contracts';
import { z } from 'zod';
import { createStore, useStore } from 'zustand';
import { persist } from 'zustand/middleware';

const guestRoutineSchema = z.object({
  id: z.uuid(),
  input: createRoutineInputSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const persistedStateSchema = z.object({
  routines: z.array(guestRoutineSchema),
});

type GuestRoutine = z.infer<typeof guestRoutineSchema>;

type GuestRoutinesState = z.infer<typeof persistedStateSchema> & {
  createRoutine: (input: CreateRoutineInput) => GuestRoutine;
  updateRoutine: (
    id: string,
    input: CreateRoutineInput,
  ) => GuestRoutine | undefined;
  deleteRoutine: (id: string) => void;
};

export function createGuestRoutinesStore() {
  return createStore<GuestRoutinesState>()(
    persist(
      (set, get) => ({
        routines: [],
        createRoutine: (input) => {
          const now = new Date().toISOString();
          const routine = {
            id: crypto.randomUUID(),
            input: createRoutineInputSchema.parse(input),
            createdAt: now,
            updatedAt: now,
          };
          set(({ routines }) => ({ routines: [routine, ...routines] }));
          return routine;
        },
        updateRoutine: (id, input) => {
          const existing = get().routines.find((routine) => routine.id === id);
          if (!existing) return undefined;

          const updated = {
            ...existing,
            input: createRoutineInputSchema.parse(input),
            updatedAt: new Date().toISOString(),
          };
          set(({ routines }) => ({
            routines: routines.map((routine) =>
              routine.id === id ? updated : routine,
            ),
          }));
          return updated;
        },
        deleteRoutine: (id) => {
          set(({ routines }) => ({
            routines: routines.filter((routine) => routine.id !== id),
          }));
        },
      }),
      {
        name: 'goforlift-guest-routines',
        partialize: ({ routines }) => ({ routines }),
        merge: (persisted, current) => {
          const result = persistedStateSchema.safeParse(persisted);
          return result.success ? { ...current, ...result.data } : current;
        },
      },
    ),
  );
}

const guestRoutinesStore = createGuestRoutinesStore();

export function useGuestRoutinesStore<T>(
  selector: (state: GuestRoutinesState) => T,
): T {
  return useStore(guestRoutinesStore, selector);
}
