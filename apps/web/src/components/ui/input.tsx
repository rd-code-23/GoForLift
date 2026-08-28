// Provides the shared visual and accessibility foundation for text inputs.
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';

export function Input({
  className,
  type = 'text',
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-md border border-input bg-surface-elevated px-4',
        'text-base text-foreground shadow-sm outline-none',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      type={type}
      {...props}
    />
  );
}
