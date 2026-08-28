/** Displays the routine collection with intentional guest, loading, error, and empty states. */
import type { RoutineSummary } from '@goforlift/contracts';
import { Link } from '@tanstack/react-router';
import { CalendarDays, Dumbbell, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import { useApplicationIdentity } from '../../app/application-identity';
import { AddActionButton } from '../../components/ui/add-action-button';
import { PageTitle } from '../../components/ui/page-title';
import { useRoutines } from './routines.query';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RoutinesLanding() {
  const identity = useApplicationIdentity();
  const isRegisteredUser = identity.kind === 'user';

  const routineContent = !isRegisteredUser ? (
    <GuestRoutinesMessage />
  ) : (
    <RegisteredUserRoutines />
  );

  return (
    <section>
      <PageTitle className="mb-6">Routines</PageTitle>
      {routineContent}
    </section>
  );
}

function GuestRoutinesMessage() {
  return (
    <RoutineMessage
      detail="Sign in with Google when you want to create routines that persist across devices."
      title="Guest routines are coming later."
    />
  );
}

function RegisteredUserRoutines() {
  const routinesQuery = useRoutines();

  if (routinesQuery.isPending) {
    return <RoutineListSkeleton />;
  }

  if (routinesQuery.isError) {
    return <RoutineLoadError onRetry={routinesQuery.refetch} />;
  }

  if (routinesQuery.data.routines.length === 0) {
    return <EmptyRoutineList />;
  }

  return <RoutineList routines={routinesQuery.data.routines} />;
}

function RoutineLoadError({ onRetry }: { onRetry: () => unknown }) {
  const retryButton = (
    <button
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      onClick={() => void onRetry()}
      type="button"
    >
      Try again
    </button>
  );

  return (
    <RoutineMessage
      action={retryButton}
      detail="Try again to reconnect to mission control."
      title="We couldn't load your routines."
    />
  );
}

function EmptyRoutineList() {
  return (
    <AddActionButton asChild>
      <Link to="/routines/new">
        <Plus aria-hidden="true" />
        Add Routine
      </Link>
    </AddActionButton>
  );
}

type RoutineListProps = {
  routines: RoutineSummary[];
};

function RoutineList({ routines }: RoutineListProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {routines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} />
      ))}
    </ul>
  );
}

type RoutineCardProps = {
  routine: RoutineSummary;
};

function RoutineCard({ routine }: RoutineCardProps) {
  const schedule = routine.scheduledDays
    .map((day) => DAY_LABELS[day])
    .join(', ');
  const exerciseLabel = routine.exerciseCount === 1 ? 'exercise' : 'exercises';

  return (
    <li className="rounded-xl border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{routine.name}</h2>
      {routine.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {routine.description}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Dumbbell aria-hidden="true" className="size-4" />
          {routine.exerciseCount} {exerciseLabel}
        </span>
        {schedule && (
          <span className="flex items-center gap-2">
            <CalendarDays aria-hidden="true" className="size-4" />
            {schedule}
          </span>
        )}
      </div>
    </li>
  );
}

type RoutineMessageProps = {
  detail: string;
  title: string;
  action?: ReactNode;
};

function RoutineMessage({ detail, title, action }: RoutineMessageProps) {
  return (
    <div className="rounded-xl border bg-surface px-6 py-12 text-center">
      <Dumbbell aria-hidden="true" className="mx-auto size-10 text-primary" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function RoutineListSkeleton() {
  return (
    <div aria-label="Loading routines" className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((item) => (
        <div
          className="h-36 animate-pulse rounded-xl border bg-surface"
          key={item}
        />
      ))}
    </div>
  );
}
