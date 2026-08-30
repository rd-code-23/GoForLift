/** Displays routine schedules and opens the responsive weekly schedule editor. */
import { Plus } from 'lucide-react';
import { useReducer } from 'react';

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
import {
  INITIAL_SCHEDULE_EDITOR_STATE,
  scheduleEditorReducer,
} from './routine-schedule-editor.reducer';

const WEEKDAYS = [
  { dayOfWeek: 0, label: 'Sunday', shortLabel: 'Sun' },
  { dayOfWeek: 1, label: 'Monday', shortLabel: 'Mon' },
  { dayOfWeek: 2, label: 'Tuesday', shortLabel: 'Tue' },
  { dayOfWeek: 3, label: 'Wednesday', shortLabel: 'Wed' },
  { dayOfWeek: 4, label: 'Thursday', shortLabel: 'Thu' },
  { dayOfWeek: 5, label: 'Friday', shortLabel: 'Fri' },
  { dayOfWeek: 6, label: 'Saturday', shortLabel: 'Sat' },
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
  const [state, dispatch] = useReducer(
    scheduleEditorReducer,
    INITIAL_SCHEDULE_EDITOR_STATE,
  );

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
            const scheduleDay = state.days[day.dayOfWeek]!;

            return (
              <div
                className={cn(
                  'grid min-h-14 grid-cols-[auto_1fr_7.5rem] items-center gap-3 px-3 py-2',
                  'transition-colors',
                  scheduleDay.isSelected && 'bg-surface/70',
                )}
                key={day.label}
              >
                <Switch
                  aria-label={`Schedule ${day.label}`}
                  checked={scheduleDay.isSelected}
                  onCheckedChange={(checked) =>
                    dispatch({
                      type: 'day-toggled',
                      dayOfWeek: day.dayOfWeek,
                      isSelected: checked,
                    })
                  }
                />
                <span className="text-sm sm:text-base">{day.shortLabel}</span>

                {scheduleDay.isSelected ? (
                  <input
                    aria-label={`${day.label} time`}
                    className={cn(
                      'h-9 w-full rounded-md border px-2 text-sm',
                      'border-input bg-surface-elevated text-foreground',
                      'outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
                    )}
                    onChange={(event) =>
                      dispatch({
                        type: 'time-changed',
                        dayOfWeek: day.dayOfWeek,
                        time: event.target.value,
                      })
                    }
                    type="time"
                    value={scheduleDay.time}
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

        <div className="mt-4 flex items-center justify-between gap-4">
          <Label htmlFor="use-shared-schedule-time">
            Use same time for selected days
          </Label>
          <Switch
            checked={state.useSameTime}
            id="use-shared-schedule-time"
            onCheckedChange={(checked) =>
              dispatch({
                type: 'shared-time-toggled',
                isEnabled: checked,
              })
            }
          />
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
