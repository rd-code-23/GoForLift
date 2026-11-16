/** Displays one persisted routine with its schedule and exercise configuration. */
import type { RoutineDetail as RoutineDetailData } from '@goforlift/contracts';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, Dumbbell } from 'lucide-react';

import { useApplicationIdentity } from '@/app/application-identity';
import { PageTitle } from '@/components/ui/page-title';
import { ApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useRoutine } from '../api/routines.query';

const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

type RoutineDetailsProps = { routineId: string };

export function RoutineDetails({ routineId }: RoutineDetailsProps) {
  const identity = useApplicationIdentity();
  const isRegisteredUser = identity.kind === 'user';
  const routineQuery = useRoutine(routineId, isRegisteredUser);

  if (!isRegisteredUser)
    return <RoutineDetailsMessage title="Sign in to view saved routines." />;
  if (routineQuery.isPending) return <RoutineDetailsSkeleton />;

  if (routineQuery.isError) {
    const notFound =
      routineQuery.error instanceof ApiError &&
      routineQuery.error.status === 404;

    return (
      <RoutineDetailsMessage
        onRetry={notFound ? undefined : routineQuery.refetch}
        title={
          notFound
            ? "We couldn't find that routine."
            : "We couldn't load this routine."
        }
      />
    );
  }

  return <RoutineContent routine={routineQuery.data} />;
}

function RoutineContent({ routine }: { routine: RoutineDetailData }) {
  return (
    <section>
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm"
        to="/routines"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to routines
      </Link>
      <PageTitle>{routine.name}</PageTitle>
      {routine.description && (
        <p className="mt-2 text-muted-foreground">{routine.description}</p>
      )}
      <ScheduleSection schedules={routine.schedules} />
      <ExerciseSection exercises={routine.exercises} />
    </section>
  );
}

function ScheduleSection({ schedules }: Pick<RoutineDetailData, 'schedules'>) {
  if (schedules.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <CalendarDays aria-hidden="true" className="size-5 text-primary" />{' '}
        Schedule
      </h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {schedules.map((schedule) => (
          <li
            className="rounded-lg border bg-surface px-4 py-3"
            key={`${schedule.dayOfWeek}-${schedule.localTime}`}
          >
            <span className="font-medium">
              {DAY_LABELS[schedule.dayOfWeek]}
            </span>{' '}
            <span className="text-muted-foreground">
              {formatScheduleTime(schedule.localTime)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExerciseSection({ exercises }: Pick<RoutineDetailData, 'exercises'>) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Exercises ({exercises.length})</h2>
      <ol className="mt-3 grid gap-4 lg:grid-cols-2">
        {exercises.map((exercise) => (
          <li
            className="rounded-xl border bg-surface p-5"
            key={exercise.position}
          >
            <div className="flex items-start gap-3">
              <Dumbbell
                aria-hidden="true"
                className="mt-1 size-5 text-primary"
              />
              <div>
                <h3 className="font-semibold">{exercise.name}</h3>
                {exercise.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {exercise.description}
                  </p>
                )}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <ExerciseValue label="Sets" value={exercise.sets} />
              <ExerciseValue label="Reps" value={exercise.targetReps} />
              <ExerciseValue
                label="Weight"
                value={`${exercise.weight} ${exercise.weightUnit}`}
              />
              <ExerciseValue
                label="Rest"
                value={`${exercise.restBetweenSetsSeconds}s`}
              />
              <ExerciseValue
                label="After exercise"
                value={`${exercise.restAfterExerciseSeconds}s`}
              />
            </dl>
            {exercise.notes && (
              <p className="mt-4 text-sm text-muted-foreground">
                {exercise.notes}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ExerciseValue({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

type RoutineDetailsMessageProps = { title: string; onRetry?: () => unknown };

function RoutineDetailsMessage({ title, onRetry }: RoutineDetailsMessageProps) {
  return (
    <section className="rounded-xl border bg-surface px-6 py-12 text-center">
      <Dumbbell aria-hidden="true" className="mx-auto size-10 text-primary" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <div className="mt-5 flex justify-center gap-3">
        {onRetry && (
          <button
            className={cn(
              'rounded-md px-4 py-2',
              'bg-primary text-sm font-semibold text-primary-foreground',
            )}
            onClick={() => void onRetry()}
            type="button"
          >
            Try again
          </button>
        )}
        <Link
          className="rounded-md border px-4 py-2 text-sm font-semibold"
          to="/routines"
        >
          Back to routines
        </Link>
      </div>
    </section>
  );
}

function RoutineDetailsSkeleton() {
  return (
    <div aria-label="Loading routine" className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded bg-surface" />
      <div className="h-40 animate-pulse rounded-xl border bg-surface" />
    </div>
  );
}

function formatScheduleTime(localTime: string) {
  const [hourText = '0', minute = '00'] = localTime.split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}
