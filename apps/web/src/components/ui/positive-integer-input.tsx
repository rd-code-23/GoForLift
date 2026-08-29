import { useState } from 'react';

import { Input } from './input';

type PositiveIntegerInputProps = {
  className?: string;
  defaultValue: number;
  id: string;
};

export function PositiveIntegerInput({
  defaultValue,
  id,
  className,
}: PositiveIntegerInputProps) {
  const [value, setValue] = useState<number | string>(defaultValue);

  const finishEditing = () => {
    if (value === '' || Number(value) < 1) {
      setValue(1);
    }
  };

  return (
    <Input
      className={className}
      id={id}
      inputMode="numeric"
      min="1"
      onBlur={finishEditing}
      onChange={(event) => {
        const nextValue = event.target.value;

        if (nextValue === '' || /^\d+$/.test(nextValue)) {
          setValue(nextValue);
        }
      }}
      type="number"
      value={value}
    />
  );
}
