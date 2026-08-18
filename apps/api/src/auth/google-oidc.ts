/** Starts Google OIDC authorization with protected state, nonce, and PKCE data. */
import { Router } from 'express';
import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type Configuration,
} from 'openid-client';

import type { Env } from '../config/env-schema.js';

const GOOGLE_ISSUER = new URL('https://accounts.google.com');
const DEFAULT_RETURN_PATH = '/';

export type OidcFlowState = {
  codeVerifier: string;
  createdAt: number;
  nonce: string;
  returnTo: string;
  state: string;
};

declare module 'express-session' {
  interface SessionData {
    oidcFlow?: OidcFlowState;
  }
}

type GoogleOidcConfiguration = Pick<
  Env,
  'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'GOOGLE_OIDC_REDIRECT_URI'
>;

export function validateReturnTo(value: unknown) {
  if (typeof value !== 'string' || !isSafeRelativePath(value)) {
    return DEFAULT_RETURN_PATH;
  }

  let decoded = value;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return DEFAULT_RETURN_PATH;
    }

    if (!isSafeRelativePath(decoded)) {
      return DEFAULT_RETURN_PATH;
    }
  }

  return value;
}

function isSafeRelativePath(value: string) {
  const containsControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });

  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !containsControlCharacter
  );
}

export function discoverGoogleOidc(configuration: GoogleOidcConfiguration) {
  return discovery(GOOGLE_ISSUER, configuration.GOOGLE_CLIENT_ID, {
    client_secret: configuration.GOOGLE_CLIENT_SECRET,
    redirect_uris: [configuration.GOOGLE_OIDC_REDIRECT_URI],
    response_types: ['code'],
  });
}

export function createGoogleOidcRouter(
  oidc: Configuration,
  redirectUri: string,
) {
  const router = Router();

  router.get('/google', async (request, response, next) => {
    try {
      const state = randomState();
      const nonce = randomNonce();
      const codeVerifier = randomPKCECodeVerifier();
      const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

      request.session.oidcFlow = {
        state,
        nonce,
        codeVerifier,
        returnTo: validateReturnTo(request.query.returnTo),
        createdAt: Date.now(),
      };

      const authorizationUrl = buildAuthorizationUrl(oidc, {
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      request.session.save((error) => {
        if (error) {
          next(error);
          return;
        }

        response.redirect(authorizationUrl.href);
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
