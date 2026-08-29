import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

type NumberStepperProps = {
  defaultValue: number;
  id: string;
  min?: number;
};

export function NumberStepper({
  defaultValue,
  id,
  min = 1,
}: NumberStepperProps) {
  const [value, setValue] = useState<number | string>(defaultValue);

  const decreaseValue = () => {
    setValue((currentValue) => Math.max(min, Number(currentValue || min) - 1));
  };

  const increaseValue = () => {
    setValue((currentValue) => Number(currentValue || min) + 1);
  };

  const finishEditing = () => {
    if (value === '' || Number(value) < min) {
      setValue(min);
    }
  };

  return (
    <div
      className={cn(
        'grid h-10 w-40 grid-cols-[2.5rem_1fr_2.5rem] overflow-hidden rounded-md border',
        'border-input bg-surface-elevated',
      )}
    >
      <Button
        aria-label="Decrease value"
        className="h-full rounded-none border-r"
        disabled={Number(value) <= min}
        onClick={decreaseValue}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Minus aria-hidden="true" className="size-4" />
      </Button>

      <input
        className="w-full min-w-0 bg-transparent px-1 text-center text-sm font-medium outline-none"
        id={id}
        min={min}
        onBlur={finishEditing}
        inputMode="numeric"
        onChange={(event) => {
          const nextValue = event.target.value;

          if (nextValue === '' || /^\d+$/.test(nextValue)) {
            setValue(nextValue);
          }
        }}
        type="number"
        value={value}
      />

      <Button
        aria-label="Increase value"
        className="h-full rounded-none border-l"
        onClick={increaseValue}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Plus aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
