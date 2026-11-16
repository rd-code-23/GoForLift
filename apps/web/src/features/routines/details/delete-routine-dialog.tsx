/** Confirms deletion of a persisted routine and returns to the routine list. */
import { useNavigate } from '@tanstack/react-router';
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
import { useDeleteRoutineMutation } from '../api/routines.mutation';

type DeleteRoutineDialogProps = {
  name: string;
  routineId: string;
};

export function DeleteRoutineDialog({
  name,
  routineId,
}: DeleteRoutineDialogProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const deleteRoutineMutation = useDeleteRoutineMutation();

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) deleteRoutineMutation.reset();
  }

  async function deleteRoutine() {
    const wasDeleted = await deleteRoutineMutation
      .mutateAsync(routineId)
      .then(() => true)
      .catch(() => false);

    if (!wasDeleted) return;

    handleOpenChange(false);
    await navigate({ to: '/routines' });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          Delete Routine
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete Routine?</DialogTitle>
        <DialogDescription className="mt-2">
          “{name}” and all of its exercise configuration and schedules will be
          permanently deleted. This action cannot be undone.
        </DialogDescription>
        {deleteRoutineMutation.isError && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            Routine could not be deleted. Please try again.
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={deleteRoutineMutation.isPending}
            onClick={() => void deleteRoutine()}
            type="button"
            variant="destructive"
          >
            {deleteRoutineMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
