/** Displays configured exercises in the routine draft. */
import { Dumbbell, GripVertical, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RoutineDraftExerciseFormValues } from '../routine-draft-form';

export function RoutineExerciseList({
  exercises,
}: {
  exercises: RoutineDraftExerciseFormValues[];
}) {
  return (
    <div className="mt-3 w-full overflow-hidden rounded-lg bg-surface-elevated lg:w-fit lg:max-w-3xl">
      <div
        className={cn(
          'hidden grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_5rem_4rem_2rem] items-center gap-2 px-3 py-2',
          'text-xs text-muted-foreground',
          'sm:grid',
        )}
      >
        <span className="pl-8">Exercise</span>
        <span className="text-center">Sets</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Rest</span>
        <span />
      </div>

      <ul>
        {exercises.map((exercise) => (
          <RoutineExerciseRow exercise={exercise} key={exercise.position} />
        ))}
      </ul>
    </div>
  );
}

function RoutineExerciseRow({
  exercise,
}: {
  exercise: RoutineDraftExerciseFormValues;
}) {
  return (
    <li
      className={cn(
        'relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border/30 px-3 py-3 first:border-t-0',
        'sm:grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_5rem_4rem_2rem] sm:gap-2 sm:py-2.5',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <GripVertical
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary">
          <Dumbbell aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{exercise.name}</p>
          <p className="text-xs text-muted-foreground sm:hidden">
            {exercise.sets} × {exercise.targetReps} · {exercise.weight}{' '}
            {exercise.weightUnit} · {exercise.restBetweenSetsSeconds}s rest
          </p>
        </div>
      </div>

      <span
        className="hidden min-w-0 truncate px-1 text-center text-sm sm:block"
        title={String(exercise.sets)}
      >
        {exercise.sets}
      </span>
      <span
        className="hidden min-w-0 truncate px-1 text-center text-sm sm:block"
        title={String(exercise.targetReps)}
      >
        {exercise.targetReps}
      </span>
      <span
        className="hidden min-w-0 truncate px-1 text-center text-sm sm:block"
        title={`${exercise.weight} ${exercise.weightUnit}`}
      >
        {exercise.weight} {exercise.weightUnit}
      </span>
      <span
        className="hidden min-w-0 truncate px-1 text-center text-sm sm:block"
        title={`${exercise.restBetweenSetsSeconds}s`}
      >
        {exercise.restBetweenSetsSeconds}s
      </span>
      <MoreHorizontal
        aria-hidden="true"
        className={cn(
          'absolute top-1/2 right-3 size-4 -translate-y-1/2',
          'text-muted-foreground',
          'sm:static sm:translate-y-0 sm:justify-self-end',
        )}
      />
    </li>
  );
}
