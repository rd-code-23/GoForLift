// Provides the consistent full-width ghost-button treatment for adding items.
import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';
import { Button } from './button';

type AddActionButtonProps = Omit<ComponentProps<typeof Button>, 'variant'>;

export function AddActionButton({ className, ...props }: AddActionButtonProps) {
  return (
    <div className="group">
      <Button
        className={cn(
          'h-14 w-full text-primary disabled:opacity-100',
          'group-hover:bg-accent group-hover:text-accent-foreground',
          className,
        )}
        variant="ghost"
        {...props}
      />
    </div>
  );
}
