/** Loads and validates the API's runtime environment during startup. */
import 'dotenv/config';

import { parseEnv } from './env-schema.js';

export const env = parseEnv(process.env);
