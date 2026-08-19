/** Defines the API health-check response contract shared across applications. */
import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'unavailable']),
  database: z.enum(['connected', 'unavailable']),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
