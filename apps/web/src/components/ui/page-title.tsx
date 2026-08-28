// Provides consistent styling for the primary title shown on application pages.
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';

export function PageTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn('text-xl font-semibold sm:text-2xl', className)}
      {...props}
    />
  );
}
