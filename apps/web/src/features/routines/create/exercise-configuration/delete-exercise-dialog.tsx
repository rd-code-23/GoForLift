/** Confirms and deletes a custom exercise owned by the current user. */
import { useState } from 'react';

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
  const deleteExerciseMutation = useDeleteExerciseMutation();

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      deleteExerciseMutation.reset();
    }
  }

  async function deleteExercise() {
    const wasDeleted = await deleteExerciseMutation
      .mutateAsync(exerciseId)
      .then(() => true)
      .catch(() => false);

    if (!wasDeleted) {
      return;
    }

    handleOpenChange(false);
    await onDeleted();
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <button className="mt-2 text-sm text-destructive" type="button">
          Delete exercise
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Delete Custom Exercise?</DialogTitle>
        <DialogDescription className="mt-2">
          “{name}” will be removed from this routine draft and your exercise
          list. This action cannot be undone.
        </DialogDescription>

        {deleteExerciseMutation.isError && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            Exercise could not be deleted. Please try again.
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
