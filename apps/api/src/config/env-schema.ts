/** Validates environment variables and derives typed runtime configuration. */
import { z } from 'zod';

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

const httpUrl = z.url().refine((value) => {
  if (!URL.canParse(value)) {
    return false;
  }

  const protocol = new URL(value).protocol;

  return protocol === 'http:' || protocol === 'https:';
}, 'Must use the http or https protocol');

const rawEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(1).default(0),
    DATABASE_URL: z.url(),
    WEB_ORIGIN: httpUrl.default('http://localhost:5173'),
    API_ORIGIN: httpUrl.default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().trim().min(1),
    GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
    GOOGLE_OIDC_REDIRECT_URI: httpUrl,
    SESSION_SECRET: z.string().min(32),
    SESSION_DURATION_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .refine(
        (value) => value === SEVEN_DAYS_SECONDS,
        'Must match the approved seven-day session lifetime',
      )
      .default(SEVEN_DAYS_SECONDS),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== 'production') {
      return;
    }

    for (const key of [
      'WEB_ORIGIN',
      'API_ORIGIN',
      'GOOGLE_OIDC_REDIRECT_URI',
    ] as const) {
      if (!value[key].startsWith('https://')) {
        context.addIssue({
          code: 'custom',
          message: 'Must use HTTPS in production',
          path: [key],
        });
      }
    }
  });

export function parseEnv(source: NodeJS.ProcessEnv) {
  const parsed = rawEnvSchema.parse(source);

  return {
    ...parsed,
    SESSION_COOKIE: {
      name: 'goforlift.sid',
      httpOnly: true,
      secure: parsed.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAgeMs: parsed.SESSION_DURATION_SECONDS * 1000,
    },
  };
}

export type Env = ReturnType<typeof parseEnv>;
