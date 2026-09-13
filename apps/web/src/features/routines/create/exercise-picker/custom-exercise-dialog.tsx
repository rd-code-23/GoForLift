/** Creates a user-owned exercise without leaving the routine exercise picker. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExerciseInputSchema,
  type CreateExerciseInput,
} from '@goforlift/contracts';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AddActionButton } from '@/components/ui/add-action-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateExerciseMutation } from '@/features/exercises/exercises.mutation';
import { cn } from '@/lib/utils';

export function CustomExerciseDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const createExerciseMutation = useCreateExerciseMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateExerciseInput>({
    defaultValues: { description: null, name: '' },
    mode: 'onSubmit',
    resolver: zodResolver(createExerciseInputSchema),
  });

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      reset();
      createExerciseMutation.reset();
    }
  }

  async function saveCustomExercise(input: CreateExerciseInput) {
    const exercise = await createExerciseMutation
      .mutateAsync(input)
      .catch(() => null);

    if (!exercise) {
      return;
    }

    handleOpenChange(false);
    await navigate({
      params: { exerciseId: exercise.id },
      to: '/routines/new/exercises/$exerciseId',
    });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <AddActionButton className="border border-dashed border-input lg:h-16 lg:text-base">
          <Plus aria-hidden="true" />
          Create Custom Exercise
        </AddActionButton>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Create Custom Exercise</DialogTitle>
        <DialogDescription className="mt-1">
          Add an exercise that will only be available to you.
        </DialogDescription>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => void handleSubmit(saveCustomExercise)(event)}
        >
          <div>
            <Label htmlFor="custom-exercise-name">Exercise Name</Label>
            <Input
              aria-describedby={
                errors.name ? 'custom-exercise-name-error' : undefined
              }
              aria-invalid={Boolean(errors.name)}
              className={cn('mt-2', errors.name && 'border-destructive')}
              id="custom-exercise-name"
              placeholder="E.g., Cable Pullover"
              {...register('name')}
            />
            {errors.name && (
              <p
                className="mt-1.5 text-sm text-destructive"
                id="custom-exercise-name-error"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="custom-exercise-description" isOptional>
              Description
            </Label>
            <textarea
              className={cn(
                'mt-2 min-h-28 w-full resize-y rounded-md border px-4 py-3',
                'border-input bg-surface-elevated text-base placeholder:text-muted-foreground',
                'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
              )}
              id="custom-exercise-description"
              placeholder="Describe how to perform the exercise."
              {...register('description', {
                setValueAs: (value: string) => value || null,
              })}
            />
          </div>

          {createExerciseMutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              Custom exercise could not be created. Please try again.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={createExerciseMutation.isPending} type="submit">
              {createExerciseMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
