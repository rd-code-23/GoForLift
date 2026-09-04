/** Presents the configuration shell for an exercise selected for a routine. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRoutineExerciseInputSchema,
  type ExerciseSummary,
} from '@goforlift/contracts';
import { Link, useNavigate } from '@tanstack/react-router';
import { Dumbbell, X } from 'lucide-react';
import {
  type UseFormRegister,
  type UseFormSetValue,
  useForm,
  useFormContext,
} from 'react-hook-form';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { NumberStepper } from '@/components/ui/number-stepper';
import { PageTitle } from '@/components/ui/page-title';
import { PositiveIntegerInput } from '@/components/ui/positive-integer-input';
import { useExercises } from '@/features/exercises/exercises.query';
import { z } from 'zod';

import type { RoutineDraftFormValues } from '../routine-draft-form';

type RoutineExerciseFormValues = z.input<
  typeof createRoutineExerciseInputSchema
>;
type RoutineExerciseInput = z.output<typeof createRoutineExerciseInputSchema>;

type ExerciseConfigurationProps = {
  exerciseId: string;
};

export function ExerciseConfiguration({
  exerciseId,
}: ExerciseConfigurationProps) {
  const exercisesQuery = useExercises();
  const exercise = exercisesQuery.data?.exercises.find(
    (availableExercise) => availableExercise.id === exerciseId,
  );

  let content = <ExerciseNotFound />;

  if (exercisesQuery.isPending) {
    content = <LoadingState />;
  } else if (exercisesQuery.isError) {
    content = (
      <p className="text-center text-sm text-destructive">
        Exercise details could not be loaded.
      </p>
    );
  } else if (exercise) {
    content = <ExerciseConfigurationForm exercise={exercise} />;
  }

  return (
    <section className="mx-auto w-full max-w-2xl lg:max-w-3xl">
      <ConfigurationHeader />
      {content}
    </section>
  );
}

function ConfigurationHeader() {
  return (
    <header className="mb-7 flex items-center gap-3">
      <Button
        aria-label="Close exercise configuration"
        asChild
        size="icon"
        variant="ghost"
      >
        <Link to="/routines/new/exercises">
          <X aria-hidden="true" />
        </Link>
      </Button>
      <PageTitle className="flex-1 text-center">Configure Exercise</PageTitle>
      <div aria-hidden="true" className="size-9" />
    </header>
  );
}

function ExerciseConfigurationForm({
  exercise,
}: {
  exercise: ExerciseSummary;
}) {
  const navigate = useNavigate();
  const { getValues, setValue: setDraftValue } =
    useFormContext<RoutineDraftFormValues>();

  const defaultValues = createRoutineExerciseInputSchema.parse({
    exerciseId: exercise.id,
    position: getValues('exercises').length,
  });

  const {
    handleSubmit,
    register,
    setValue: setConfigurationValue,
  } = useForm<RoutineExerciseFormValues, unknown, RoutineExerciseInput>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(createRoutineExerciseInputSchema),
  });

  async function saveExercise(input: RoutineExerciseInput) {
    setDraftValue(
      'exercises',
      [...getValues('exercises'), { ...input, name: exercise.name }],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    await navigate({ to: '/routines/new' });
  }

  return (
    <form
      className="lg:grid lg:grid-cols-[1fr_3fr] lg:divide-x lg:divide-border/40"
      onSubmit={(event) => void handleSubmit(saveExercise)(event)}
    >
      <ExerciseIdentity exercise={exercise} />

      <div className="mt-7 lg:mt-0 lg:pl-8">
        <ExerciseFields
          defaultValues={defaultValues}
          register={register}
          setValue={setConfigurationValue}
        />
      </div>
    </form>
  );
}

function ExerciseIdentity({ exercise }: { exercise: ExerciseSummary }) {
  return (
    <div className="flex items-center gap-4 lg:flex-col lg:justify-start lg:pr-8 lg:pt-2 lg:text-center">
      <div
        className={cn(
          'flex size-16 shrink-0 items-center justify-center rounded-xl',
          'bg-surface-elevated text-primary',
          'lg:size-28',
        )}
      >
        <Dumbbell aria-hidden="true" className="size-8 lg:size-14" />
      </div>
      <div>
        <h2 className="text-lg font-semibold lg:text-xl">{exercise.name}</h2>
        {exercise.isCustom && (
          <button
            className="mt-1 text-sm text-primary disabled:opacity-100"
            disabled
            type="button"
          >
            Edit name
          </button>
        )}
      </div>
    </div>
  );
}

function ExerciseFields({
  defaultValues,
  register,
  setValue,
}: {
  defaultValues: RoutineExerciseInput;
  register: UseFormRegister<RoutineExerciseFormValues>;
  setValue: UseFormSetValue<RoutineExerciseFormValues>;
}) {
  return (
    <div>
      <div className="space-y-5">
        <NumberField
          defaultValue={defaultValues.sets}
          field="sets"
          id="exercise-sets"
          label="Sets"
          setValue={setValue}
        />
        <NumberField
          defaultValue={defaultValues.targetReps}
          field="targetReps"
          id="exercise-reps"
          label="Reps"
          setValue={setValue}
        />

        <div className="flex items-center justify-between gap-6">
          <Label htmlFor="exercise-weight">Weight</Label>
          <div
            className={cn(
              'grid h-10 w-40 grid-cols-[1fr_auto] overflow-hidden rounded-md border',
              'border-input bg-surface-elevated',
            )}
          >
            <PositiveIntegerInput
              className="h-full min-w-0 rounded-none border-0 bg-transparent shadow-none"
              defaultValue={defaultValues.weight}
              id="exercise-weight"
              onValueChange={(value) =>
                setValue('weight', value, { shouldValidate: true })
              }
            />
            <select
              aria-label="Weight unit"
              className="h-full border-0 border-l border-input bg-surface-elevated px-3 text-sm outline-none"
              defaultValue={defaultValues.weightUnit}
              {...register('weightUnit')}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        <NumberField
          defaultValue={defaultValues.restBetweenSetsSeconds}
          field="restBetweenSetsSeconds"
          id="exercise-rest"
          label="Rest Between Sets"
          setValue={setValue}
          suffix="seconds"
        />

        <div>
          <Label htmlFor="exercise-notes" isOptional>
            Notes
          </Label>
          <textarea
            className={cn(
              'mt-2 min-h-24 w-full resize-y rounded-md border px-3 py-2',
              'border-input bg-surface-elevated text-sm placeholder:text-muted-foreground',
              'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            )}
            id="exercise-notes"
            placeholder="E.g., keep elbows tucked in."
            {...register('notes')}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button asChild variant="outline">
          <Link to="/routines/new/exercises">Cancel</Link>
        </Button>
        <Button type="submit">Done</Button>
      </div>
    </div>
  );
}

type NumberFieldProps = {
  defaultValue: number;
  field: 'sets' | 'targetReps' | 'restBetweenSetsSeconds';
  id: string;
  label: string;
  setValue: UseFormSetValue<RoutineExerciseFormValues>;
  suffix?: string;
};

function NumberField({
  defaultValue,
  field,
  id,
  label,
  setValue,
  suffix,
}: NumberFieldProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <Label className="whitespace-nowrap" htmlFor={id}>
        {label}
      </Label>

      {suffix ? (
        <div
          className={cn(
            'grid h-10 w-40 grid-cols-[1fr_auto] overflow-hidden rounded-md border',
            'border-input bg-surface-elevated',
          )}
        >
          <PositiveIntegerInput
            className="h-full rounded-none border-0 bg-transparent shadow-none"
            defaultValue={defaultValue}
            id={id}
            onValueChange={(value) =>
              setValue(field, value, { shouldValidate: true })
            }
          />
          <span className="flex items-center border-l px-3 text-sm text-muted-foreground">
            {suffix}
          </span>
        </div>
      ) : (
        <NumberStepper
          defaultValue={defaultValue}
          id={id}
          onValueChange={(value) =>
            setValue(field, value, { shouldValidate: true })
          }
        />
      )}
    </div>
  );
}

function ExerciseNotFound() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Exercise not found.
    </p>
  );
}
