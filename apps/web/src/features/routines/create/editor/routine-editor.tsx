/** Presents the responsive visual shell for creating a registered-user routine. */
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { AddActionButton } from '@/components/ui/add-action-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle } from '@/components/ui/page-title';
import { useCreateRoutineMutation } from '@/features/routines/api/routines.mutation';
import { cn } from '@/lib/utils';
import type {
  ParsedRoutineDraftFormValues,
  RoutineDraftExerciseFormValues,
  RoutineDraftFormValues,
} from '../routine-draft-form';
import { toCreateRoutineInput } from '../routine-draft.mapper';
import { RoutineExerciseList } from './routine-exercise-list';
import { RoutineScheduleField } from './routine-schedule-field';

export function RoutineEditor() {
  const navigate = useNavigate();
  const createRoutineMutation = useCreateRoutineMutation();
  const {
    formState: { isValid },
    handleSubmit,
    reset,
  } = useFormContext<
    RoutineDraftFormValues,
    unknown,
    ParsedRoutineDraftFormValues
  >();

  const addExercise = async () => {
    await navigate({ to: '/routines/new/exercises' });
  };

  const editExercise = async (exercise: RoutineDraftExerciseFormValues) => {
    await navigate({
      params: { exerciseId: exercise.exerciseId },
      search: { position: exercise.position },
      to: '/routines/new/exercises/$exerciseId',
    });
  };

  function saveRoutine(draft: ParsedRoutineDraftFormValues) {
    createRoutineMutation.mutate(toCreateRoutineInput(draft), {
      onSuccess: () => {
        reset();
        void navigate({ to: '/routines' });
      },
    });
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <EditorHeader
        canSave={isValid}
        isSaving={createRoutineMutation.isPending}
        onClear={() => reset()}
      />

      {createRoutineMutation.isError && (
        <p className="mb-5 text-sm text-destructive" role="alert">
          Routine could not be saved. Please try again.
        </p>
      )}

      <form
        className="grid gap-6 lg:grid-cols-2"
        id="routine-editor-form"
        onSubmit={(event) => void handleSubmit(saveRoutine)(event)}
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
  canSave,
  isSaving,
  onClear,
}: {
  canSave: boolean;
  isSaving: boolean;
  onClear: () => void;
}) {
  return (
    <header className="mb-7 flex items-center gap-3 border-b pb-5">
      <Button aria-label="Back to routines" asChild size="icon" variant="ghost">
        <Link to="/routines">
          <ArrowLeft aria-hidden="true" />
        </Link>
      </Button>
      <PageTitle>Create Routine</PageTitle>
      <div className="ml-auto flex gap-2">
        <Button
          disabled={isSaving}
          onClick={onClear}
          type="button"
          variant="ghost"
        >
          Clear
        </Button>
        <Button
          disabled={!canSave || isSaving}
          form="routine-editor-form"
          type="submit"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
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
  const { control, getValues, setValue } =
    useFormContext<RoutineDraftFormValues>();
  const exercises = useWatch({ control, name: 'exercises' });

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

  return (
    <div>
      <Label asChild>
        <h2>Exercises ({exercises.length})</h2>
      </Label>

      {exercises.length > 0 && (
        <RoutineExerciseList
          exercises={exercises}
          onEdit={onEditExercise}
          onRemove={removeExercise}
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
