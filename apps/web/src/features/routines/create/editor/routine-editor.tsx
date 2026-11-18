/** Presents the responsive visual shell for creating a registered-user routine. */
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { AddActionButton } from '@/components/ui/add-action-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle } from '@/components/ui/page-title';
import { exercisesQueryOptions } from '@/features/exercises/exercises.query';
import {
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
} from '@/features/routines/api/routines.mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import type {
  ParsedRoutineDraftFormValues,
  RoutineDraftExerciseFormValues,
  RoutineDraftFormValues,
} from '../routine-draft-form';
import { toCreateRoutineInput } from '../routine-draft.mapper';
import { reorderRoutineExercises } from './routine-exercise-order';
import { RoutineExerciseList } from './routine-exercise-list';
import { RoutineScheduleField } from './routine-schedule-field';

type RoutineEditorProps = {
  mode?: 'create' | 'edit';
  routineId?: string;
};

export function RoutineEditor({
  mode = 'create',
  routineId,
}: RoutineEditorProps) {
  const navigate = useNavigate();
  const isEditing = mode === 'edit';

  const [showRequiredFieldsMessage, setShowRequiredFieldsMessage] =
    useState(false);

  const createRoutineMutation = useCreateRoutineMutation();
  const updateRoutineMutation = useUpdateRoutineMutation();
  const activeMutation = isEditing
    ? updateRoutineMutation
    : createRoutineMutation;
  const { handleSubmit, reset } = useFormContext<
    RoutineDraftFormValues,
    unknown,
    ParsedRoutineDraftFormValues
  >();

  const saveErrorMessage = activeMutation.isError
    ? getApiErrorMessage(
        activeMutation.error,
        "We couldn't save your routine. Try again.",
        {
          invalid_exercise_selection:
            'One or more exercises are no longer available. Review your exercises and try again.',
          routine_not_found:
            'This routine could not be found. It may have already been deleted.',
        },
      )
    : undefined;

  const addExercise = async () => {
    if (isEditing && routineId) {
      await navigate({
        params: { routineId },
        to: '/routines/$routineId/edit/exercises',
      });
      return;
    }

    await navigate({ to: '/routines/new/exercises' });
  };

  const editExercise = async (exercise: RoutineDraftExerciseFormValues) => {
    if (isEditing && routineId) {
      await navigate({
        params: { exerciseId: exercise.exerciseId, routineId },
        search: { position: exercise.position },
        to: '/routines/$routineId/edit/exercises/$exerciseId',
      });
      return;
    }

    await navigate({
      params: { exerciseId: exercise.exerciseId },
      search: { position: exercise.position },
      to: '/routines/new/exercises/$exerciseId',
    });
  };

  function saveRoutine(draft: ParsedRoutineDraftFormValues) {
    setShowRequiredFieldsMessage(false);

    const input = toCreateRoutineInput(draft);

    if (isEditing && routineId) {
      updateRoutineMutation.mutate(
        { input, routineId },
        {
          onSuccess: () =>
            void navigate({
              params: { routineId },
              to: '/routines/$routineId',
            }),
        },
      );
      return;
    }

    createRoutineMutation.mutate(input, {
      onSuccess: () => {
        reset();
        void navigate({ to: '/routines' });
      },
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <EditorHeader
        isEditing={isEditing}
        isSaving={activeMutation.isPending}
        onClear={() => {
          reset();
          setShowRequiredFieldsMessage(false);
        }}
        routineId={routineId}
        showRequiredFieldsMessage={showRequiredFieldsMessage}
      />

      {saveErrorMessage && (
        <p className="mb-5 text-sm text-destructive" role="alert">
          {saveErrorMessage}
        </p>
      )}

      <form
        className="grid gap-6 lg:grid-cols-2"
        id="routine-editor-form"
        onChange={() => setShowRequiredFieldsMessage(false)}
        onClick={() => setShowRequiredFieldsMessage(false)}
        onSubmit={(event) =>
          void handleSubmit(saveRoutine, () =>
            setShowRequiredFieldsMessage(true),
          )(event)
        }
      >
        <RoutineDetails />
        <RoutineScheduleField />

        <div className="lg:col-span-2">
          <ExerciseSection
            onAddExercise={() => void addExercise()}
            onEditExercise={(exercise) => void editExercise(exercise)}
          />
        </div>
      </form>
    </section>
  );
}

function EditorHeader({
  isEditing,
  isSaving,
  onClear,
  routineId,
  showRequiredFieldsMessage,
}: {
  isEditing: boolean;
  isSaving: boolean;
  onClear: () => void;
  showRequiredFieldsMessage: boolean;
  routineId?: string;
}) {
  const backLink =
    isEditing && routineId ? (
      <Link params={{ routineId }} to="/routines/$routineId">
        <ArrowLeft aria-hidden="true" />
      </Link>
    ) : (
      <Link to="/routines">
        <ArrowLeft aria-hidden="true" />
      </Link>
    );

  return (
    <header className="mb-7 flex items-center gap-3 border-b pb-5">
      <Button aria-label="Back to routines" asChild size="icon" variant="ghost">
        {backLink}
      </Button>
      <PageTitle>{isEditing ? 'Edit Routine' : 'Create Routine'}</PageTitle>
      <div className="ml-auto flex gap-2">
        <Button
          disabled={isSaving}
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          {isEditing ? 'Reset' : 'Clear'}
        </Button>
        <div className="flex w-20 flex-col items-start gap-1">
          <Button
            className="w-full"
            disabled={isSaving}
            form="routine-editor-form"
            type="submit"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          <p
            aria-live="polite"
            className={cn(
              'min-h-12 w-full text-left text-xs text-destructive',
              !showRequiredFieldsMessage && 'invisible',
            )}
          >
            Complete required fields.
          </p>
        </div>
      </div>
    </header>
  );
}

function RoutineDetails() {
  const {
    formState: { errors },
    register,
  } = useFormContext<RoutineDraftFormValues>();

  const errorMessage = errors.name?.message;

  return (
    <div>
      <Label htmlFor="routine-name">Routine Name</Label>
      <Input
        aria-describedby={errorMessage ? 'routine-name-error' : undefined}
        aria-invalid={errorMessage ? true : undefined}
        className={cn(
          'mt-2',
          'focus-visible:border-foreground/40 focus-visible:ring-foreground/10',
          'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30',
          'aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/30',
        )}
        id="routine-name"
        placeholder="e.g., Upper Body"
        {...register('name')}
      />
      {errorMessage && (
        <p
          className="mt-2 text-sm text-destructive"
          id="routine-name-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function ExerciseSection({
  onAddExercise,
  onEditExercise,
}: {
  onAddExercise: () => void;
  onEditExercise: (exercise: RoutineDraftExerciseFormValues) => void;
}) {
  const {
    control,
    formState: { errors, submitCount },
    getValues,
    setValue,
  } = useFormContext<RoutineDraftFormValues>();
  const exercises = useWatch({ control, name: 'exercises' });

  const exercisesQuery = useQuery({
    ...exercisesQueryOptions,
    enabled: false,
  });

  const exerciseNames = new Map(
    exercisesQuery.data?.exercises.map((exercise) => [
      exercise.id,
      exercise.name,
    ]),
  );

  const displayedExercises = exercises.map((exercise) => ({
    ...exercise,
    name: exerciseNames.get(exercise.exerciseId) ?? 'Exercise unavailable',
  }));

  const errorMessage = errors.exercises?.message;

  function removeExercise(position: number) {
    const remainingExercises = getValues('exercises')
      .filter((exercise) => exercise.position !== position)
      .map((exercise, nextPosition) => ({
        ...exercise,
        position: nextPosition,
      }));

    setValue('exercises', remainingExercises, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function reorderExercises(fromIndex: number, toIndex: number) {
    setValue(
      'exercises',
      reorderRoutineExercises(exercises, fromIndex, toIndex),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  return (
    <div>
      <Label asChild>
        <h2>Exercises ({exercises.length})</h2>
      </Label>

      {submitCount > 0 && errorMessage && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      {exercises.length > 0 && (
        <RoutineExerciseList
          exercises={displayedExercises}
          onEdit={onEditExercise}
          onRemove={removeExercise}
          onReorder={reorderExercises}
        />
      )}

      <div className={exercises.length > 0 ? 'mt-1' : 'mt-3'}>
        <AddActionButton onClick={onAddExercise} type="button">
          <Plus aria-hidden="true" />
          Add Exercise
        </AddActionButton>
      </div>
    </div>
  );
}
