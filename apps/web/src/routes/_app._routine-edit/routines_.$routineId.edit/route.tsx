/** Loads a saved routine into an isolated form shared across its edit routes. */
import { Link, createFileRoute, Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';

import { useApplicationIdentity } from '@/app/application-identity';
import { LoadingState } from '@/components/ui/loading-state';
import { useExercises } from '@/features/exercises/exercises.query';
import { useRoutine } from '@/features/routines/api/routines.query';
import { RoutineDraftFormProvider } from '@/features/routines/create/routine-draft-form';
import { toRoutineDraftFormValues } from '@/features/routines/create/routine-draft.mapper';
import { useGuestRoutinesStore } from '@/features/routines/guest/guest-routines.store';
import { getApiErrorMessage } from '@/lib/api-error-message';

export const Route = createFileRoute(
  '/_app/_routine-edit/routines_/$routineId/edit',
)({
  component: RoutineEditFormLayout,
});

function RoutineEditFormLayout() {
  const { routineId } = Route.useParams();
  const identity = useApplicationIdentity();
  const isRegisteredUser = identity.kind === 'user';
  const routineQuery = useRoutine(routineId, isRegisteredUser);
  const guestRoutine = useGuestRoutinesStore((state) =>
    state.routines.find((routine) => routine.id === routineId),
  );
  const exercisesQuery = useExercises(
    isRegisteredUser || !!guestRoutine,
    !isRegisteredUser,
  );
  const routine = isRegisteredUser ? routineQuery.data : guestRoutine?.input;
  const defaultValues = useMemo(
    () => (routine ? toRoutineDraftFormValues(routine) : undefined),
    [routine],
  );

  if (!isRegisteredUser && !guestRoutine) {
    return (
      <EditLoadError message="This routine could not be found on this device." />
    );
  }

  if (
    (isRegisteredUser && routineQuery.isPending) ||
    exercisesQuery.isPending
  ) {
    return <LoadingState label="Loading routine…" />;
  }

  if (isRegisteredUser && routineQuery.isError) {
    return (
      <EditLoadError
        message={getApiErrorMessage(
          routineQuery.error,
          "We couldn't load this routine. Try again.",
          {
            routine_not_found:
              'This routine could not be found. It may have already been deleted.',
          },
        )}
      />
    );
  }

  if (exercisesQuery.isError || !defaultValues) {
    return (
      <EditLoadError message="Exercises could not be loaded. Try again." />
    );
  }

  return (
    <RoutineDraftFormProvider defaultValues={defaultValues} key={routineId}>
      <Outlet />
    </RoutineDraftFormProvider>
  );
}

function EditLoadError({ message }: { message: string }) {
  return (
    <section className="rounded-xl border bg-surface px-6 py-12 text-center">
      <p className="text-destructive" role="alert">
        {message}
      </p>
      <Link
        className="mt-5 inline-block rounded-md border px-4 py-2 text-sm font-semibold"
        to="/routines"
      >
        Back to routines
      </Link>
    </section>
  );
}
