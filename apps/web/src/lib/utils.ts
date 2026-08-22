// Combines conditional class names and resolves conflicting Tailwind utilities for reusable components.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// `cn` means "class names"; this helper keeps conditional styles readable and
// ensures later Tailwind utilities correctly override conflicting earlier ones.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
