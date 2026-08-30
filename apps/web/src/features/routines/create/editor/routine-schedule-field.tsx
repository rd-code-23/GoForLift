/** Displays routine schedules and opens the responsive weekly schedule editor. */
import { Plus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const WEEKDAYS = [
  { label: 'Sunday', shortLabel: 'Sun' },
  { label: 'Monday', shortLabel: 'Mon' },
  { label: 'Tuesday', shortLabel: 'Tue' },
  { label: 'Wednesday', shortLabel: 'Wed' },
  { label: 'Thursday', shortLabel: 'Thu' },
  { label: 'Friday', shortLabel: 'Fri' },
  { label: 'Saturday', shortLabel: 'Sat' },
] as const;

export function RoutineScheduleField() {
  return (
    <div>
      <Label isOptional>Schedule</Label>

      <div className="mt-2 flex min-h-14 items-center">
        <ScheduleDialog />
      </div>
    </div>
  );
}

function ScheduleDialog() {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  function setDaySelected(day: string, isSelected: boolean) {
    setSelectedDays((currentDays) => {
      const nextDays = new Set(currentDays);

      if (isSelected) {
        nextDays.add(day);
      } else {
        nextDays.delete(day);
      }

      return nextDays;
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label="Add schedule"
          className="size-14 rounded-lg border-input bg-surface-elevated"
          size="icon"
          type="button"
          variant="outline"
        >
          <Plus aria-hidden="true" className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Schedule Routine</DialogTitle>
        <DialogDescription className="mt-1">
          Choose the days and time for this routine.
        </DialogDescription>

        <div className="mt-6 divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60">
          {WEEKDAYS.map((day) => {
            const isSelected = selectedDays.has(day.label);

            return (
              <div
                className={cn(
                  'grid min-h-14 grid-cols-[auto_1fr_7.5rem] items-center gap-3 px-3 py-2',
                  'transition-colors',
                  isSelected && 'bg-surface/70',
                )}
                key={day.label}
              >
                <Switch
                  aria-label={`Schedule ${day.label}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    setDaySelected(day.label, checked)
                  }
                />
                <span className="text-sm sm:text-base">{day.shortLabel}</span>

                {isSelected ? (
                  <input
                    aria-label={`${day.label} time`}
                    className={cn(
                      'h-9 w-full rounded-md border px-2 text-sm',
                      'border-input bg-surface-elevated text-foreground',
                      'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
                    )}
                    defaultValue="18:00"
                    type="time"
                  />
                ) : (
                  <span className="pr-2 text-right text-muted-foreground">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled type="button">
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
