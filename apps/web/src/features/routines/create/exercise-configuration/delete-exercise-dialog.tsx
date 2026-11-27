/** Confirms custom exercise deletion and protects saved guest routines. */
import { useContext, useState } from 'react';

import { ApplicationIdentityContext } from '@/app/application-identity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDeleteExerciseMutation } from '@/features/exercises/exercises.mutation';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import { useGuestRoutinesStore } from '../../guest/guest-routines.store';

type DeleteExerciseDialogProps = {
  exerciseId: string;
  name: string;
  onDeleted: () => Promise<void>;
};

export function DeleteExerciseDialog({
  exerciseId,
  name,
  onDeleted,
}: DeleteExerciseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deletionBlocked, setDeletionBlocked] = useState(false);
  const isGuest = useContext(ApplicationIdentityContext)?.kind === 'guest';
  const usedInSavedRoutine = useGuestRoutinesStore(
    (state) =>
      isGuest &&
      state.routines.some(({ input }) =>
        input.exercises.some((exercise) => exercise.exerciseId === exerciseId),
      ),
  );
  const deleteExerciseMutation = useDeleteExerciseMutation();

  const deleteErrorMessage = deleteExerciseMutation.isError
    ? getApiErrorMessage(
        deleteExerciseMutation.error,
        "We couldn't delete the exercise. Try again.",
        {
          exercise_not_found: 'This exercise has already been deleted.',
        },
      )
    : undefined;

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      setDeletionBlocked(false);
      deleteExerciseMutation.reset();
    }
  }

  async function deleteExercise() {
    if (usedInSavedRoutine) {
      setDeletionBlocked(true);
      return;
    }

    try {
      await deleteExerciseMutation.mutateAsync(exerciseId);
    } catch {
      // The mutation exposes the error in the dialog.
      return;
    }
    handleOpenChange(false);
    await onDeleted();
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'text-left',
            'text-sm font-medium text-primary',
            'hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          type="button"
        >
          Delete exercise
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Delete Custom Exercise?</DialogTitle>
        <DialogDescription className="mt-2">
          “{name}” will be removed from this routine draft and your exercise
          list. This action cannot be undone.
        </DialogDescription>

        {deletionBlocked && usedInSavedRoutine && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            Remove this exercise from your saved routines before deleting it.
          </p>
        )}

        {deleteErrorMessage && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {deleteErrorMessage}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={deleteExerciseMutation.isPending}
            onClick={() => void deleteExercise()}
            type="button"
            variant="destructive"
          >
            {deleteExerciseMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
