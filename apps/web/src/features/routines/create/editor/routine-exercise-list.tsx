/** Displays configured exercises in the routine draft. */
import {
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { Dumbbell, GripVertical, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { RoutineDraftExerciseFormValues } from '../routine-draft-form';

const reorderSensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: 4 }),
    ],
  }),
  KeyboardSensor,
];

export function RoutineExerciseList({
  exercises,
  onEdit,
  onRemove,
  onReorder,
}: {
  exercises: RoutineDraftExerciseFormValues[];
  onEdit: (exercise: RoutineDraftExerciseFormValues) => void;
  onRemove: (position: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
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

      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;

          const { source } = event.operation;

          if (isSortable(source) && source.initialIndex !== source.index) {
            onReorder(source.initialIndex, source.index);
          }
        }}
        sensors={reorderSensors}
      >
        <ul>
          {exercises.map((exercise, index) => (
            <RoutineExerciseRow
              exercise={exercise}
              index={index}
              key={exercise.draftExerciseId}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </DragDropProvider>
    </div>
  );
}

function RoutineExerciseRow({
  exercise,
  index,
  onEdit,
  onRemove,
}: {
  exercise: RoutineDraftExerciseFormValues;
  index: number;
  onEdit: (exercise: RoutineDraftExerciseFormValues) => void;
  onRemove: (position: number) => void;
}) {
  const { handleRef, isDragging, ref } = useSortable({
    id: exercise.draftExerciseId,
    index,
  });

  return (
    <li
      className={cn(
        'relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border/30 px-3 py-3 first:border-t-0',
        'sm:grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_5rem_4rem_2rem] sm:gap-2 sm:py-2.5',
        isDragging && 'z-10 opacity-70',
      )}
      ref={ref}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          aria-label={`Reorder ${exercise.name}`}
          className="size-7 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          ref={handleRef}
          size="icon"
          type="button"
          variant="ghost"
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </Button>
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions for ${exercise.name}`}
            className={cn(
              'absolute top-1/2 right-1 size-8 -translate-y-1/2',
              'text-muted-foreground',
              'sm:static sm:translate-y-0 sm:justify-self-end',
            )}
            size="icon"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(exercise)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onRemove(exercise.position)}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
