/** Presents the responsive visual shell for creating a registered-user routine. */
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { AddActionButton } from '../../components/ui/add-action-button';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageTitle } from '../../components/ui/page-title';
import { cn } from '../../lib/utils';
import type { RoutineDraftFormValues } from './routine-draft-form';
import { RoutineExerciseList } from './routine-exercise-list';
import { RoutineScheduleField } from './routine-schedule-field';

export function RoutineEditor() {
  const navigate = useNavigate();

  const addExercise = async () => {
    await navigate({ to: '/routines/new/exercises' });
  };

  return (
    <section className="mx-auto w-full max-w-5xl">
      <EditorHeader />

      <form className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <RoutineDetails />
          <ExerciseSection onAddExercise={() => void addExercise()} />
        </div>

        <RoutineScheduleField />
      </form>
    </section>
  );
}

function EditorHeader() {
  return (
    <header className="mb-7 flex items-center gap-3 border-b pb-5">
      <Button aria-label="Back to routines" asChild size="icon" variant="ghost">
        <Link to="/routines">
          <ArrowLeft aria-hidden="true" />
        </Link>
      </Button>
      <PageTitle>Create Routine</PageTitle>
      <div className="ml-auto flex gap-2">
        <Button className="hidden sm:inline-flex" disabled variant="outline">
          Preview
        </Button>
        <Button disabled>Save</Button>
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

function ExerciseSection({ onAddExercise }: { onAddExercise: () => void }) {
  const { control } = useFormContext<RoutineDraftFormValues>();
  const exercises = useWatch({ control, name: 'exercises' });

  return (
    <div>
      <Label asChild>
        <h2>Exercises ({exercises.length})</h2>
      </Label>

      {exercises.length > 0 && <RoutineExerciseList exercises={exercises} />}

      <div className={exercises.length > 0 ? 'mt-1' : 'mt-3'}>
        <AddActionButton onClick={onAddExercise} type="button">
          <Plus aria-hidden="true" />
          Add Exercise
        </AddActionButton>
      </div>
    </div>
  );
}
