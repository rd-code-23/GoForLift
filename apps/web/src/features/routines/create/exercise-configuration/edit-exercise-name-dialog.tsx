/** Renames a custom exercise owned by the current user. */
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateExerciseInputSchema,
  type UpdateExerciseInput,
} from '@goforlift/contracts';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { useUpdateExerciseNameMutation } from '@/features/exercises/exercises.mutation';
import { cn } from '@/lib/utils';

type EditExerciseNameDialogProps = {
  exerciseId: string;
  name: string;
};

export function EditExerciseNameDialog({
  exerciseId,
  name,
}: EditExerciseNameDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateNameMutation = useUpdateExerciseNameMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<UpdateExerciseInput>({
    defaultValues: { name },
    mode: 'onSubmit',
    resolver: zodResolver(updateExerciseInputSchema),
  });

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (open) {
      reset({ name });
    } else {
      updateNameMutation.reset();
    }
  }

  async function saveName(input: UpdateExerciseInput) {
    const exercise = await updateNameMutation
      .mutateAsync({ exerciseId, input })
      .catch(() => null);

    if (!exercise) {
      return;
    }

    handleOpenChange(false);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <button className="mt-1 text-sm text-primary" type="button">
          Edit name
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Edit Exercise Name</DialogTitle>
        <DialogDescription className="mt-1">
          This changes the name everywhere this custom exercise appears.
        </DialogDescription>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.stopPropagation();
            void handleSubmit(saveName)(event);
          }}
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

          {updateNameMutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              Exercise name could not be updated. Please try again.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={updateNameMutation.isPending} type="submit">
              {updateNameMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
