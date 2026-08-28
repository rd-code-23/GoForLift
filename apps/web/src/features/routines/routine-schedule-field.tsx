/** Displays routine schedule selections and the entry point for adding one. */
import { Plus } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

export function RoutineScheduleField() {
  return (
    <div>
      <Label isOptional>Schedule</Label>

      <div className="mt-2 flex min-h-14 items-center">
        <Button
          aria-label="Add schedule"
          className="size-14 rounded-lg border-input bg-surface-elevated disabled:opacity-100"
          disabled
          size="icon"
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </div>
  );
}
