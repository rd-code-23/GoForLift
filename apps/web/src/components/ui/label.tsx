// Provides consistent typography and accessibility styling for form labels.
import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';

import { cn } from '../../lib/utils';

type LabelProps = ComponentProps<'label'> & {
  asChild?: boolean;
  isOptional?: boolean;
};

export function Label({
  asChild = false,
  children,
  className,
  isOptional = false,
  ...props
}: LabelProps) {
  const labelClassName = cn(
    'text-[15px] font-normal text-foreground',
    className,
  );

  if (asChild) {
    return (
      <Slot.Root className={labelClassName} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <label className={labelClassName} {...props}>
      {children}
      {isOptional && (
        <>
          {' '}
          <span className="text-muted-foreground">(optional)</span>
        </>
      )}
    </label>
  );
}
