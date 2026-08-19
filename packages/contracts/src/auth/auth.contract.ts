/** Defines browser-safe authentication API contracts shared across applications. */
import { z } from 'zod';

// Defines the least-exposure user profile safe to return to the browser.
export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().nullable(),
  avatarUrl: z.url().nullable(),
});

// Represents either the logged-in user's public profile or an anonymous visitor.
export const currentUserResponseSchema = z.object({
  user: publicUserSchema.nullable(),
});

export const csrfTokenResponseSchema = z.object({
  csrfToken: z.string().min(1),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;
export type CsrfTokenResponse = z.infer<typeof csrfTokenResponseSchema>;
