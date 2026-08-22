/** Defines secure Google OIDC login-start and callback routes. */
import { Router } from 'express';
import {
  buildAuthorizationUrl,
  authorizationCodeGrant,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
  type Configuration,
} from 'openid-client';
import { z } from 'zod';

import type { Env } from '../../config/env-schema.js';
import type { GoogleUserProfile } from './google-user.service.js';

const GOOGLE_ISSUER = new URL('https://accounts.google.com');
const DEFAULT_RETURN_PATH = '/dashboard';
const OIDC_FLOW_LIFETIME_MS = 10 * 60 * 1000;

const googleIdentitySchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  name: z.string().min(1).optional(),
  picture: z.url().optional(),
});

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

type AuthorizationChecks = {
  expectedNonce: string;
  expectedState: string;
  idTokenExpected: true;
  pkceCodeVerifier: string;
};

export type ExchangeAuthorizationCode = (
  oidc: Configuration,
  callbackUrl: URL,
  checks: AuthorizationChecks,
) => Promise<{ claims: () => unknown }>;

type GoogleOidcRouterOptions = {
  exchangeAuthorizationCode?: ExchangeAuthorizationCode;
  now?: () => number;
  oidc: Configuration;
  provisionUser: (profile: GoogleUserProfile) => Promise<{ id: string }>;
  redirectUri: string;
  webOrigin: string;
};

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

const exchangeWithOpenIdClient: ExchangeAuthorizationCode = async (
  oidc,
  callbackUrl,
  checks,
) => authorizationCodeGrant(oidc, callbackUrl, checks);

export function createGoogleOidcRouter({
  exchangeAuthorizationCode = exchangeWithOpenIdClient,
  now = Date.now,
  oidc,
  provisionUser,
  redirectUri,
  webOrigin,
}: GoogleOidcRouterOptions) {
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
        createdAt: now(),
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

  router.get('/google/callback', async (request, response, next) => {
    const flow = request.session.oidcFlow;
    if (!flow || now() - flow.createdAt > OIDC_FLOW_LIFETIME_MS) {
      response.status(400).json({ error: 'invalid_oidc_callback' });
      return;
    }

    const returnTo = flow.returnTo;
    delete request.session.oidcFlow;

    try {
      await saveSession(request.session);
    } catch (error) {
      next(error);
      return;
    }

    let profile: GoogleUserProfile;
    try {
      const callbackUrl = new URL(redirectUri);
      callbackUrl.search = new URL(
        request.originalUrl,
        'http://callback.local',
      ).search;
      const tokens = await exchangeAuthorizationCode(oidc, callbackUrl, {
        expectedState: flow.state,
        expectedNonce: flow.nonce,
        pkceCodeVerifier: flow.codeVerifier,
        idTokenExpected: true,
      });
      const identity = googleIdentitySchema.parse(tokens.claims());
      profile = {
        subject: identity.sub,
        email: identity.email,
        displayName: identity.name,
        avatarUrl: identity.picture,
      };
    } catch {
      response.status(400).json({ error: 'invalid_oidc_callback' });
      return;
    }

    try {
      const user = await provisionUser(profile);
      await regenerateSession(request.session);
      request.session.userId = user.id;
      await saveSession(request.session);
      response.redirect(new URL(returnTo, webOrigin).href);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function saveSession(sessionData: Express.Request['session']) {
  return new Promise<void>((resolve, reject) => {
    sessionData.save((error) =>
      error
        ? reject(
            error instanceof Error
              ? error
              : new Error('Failed to save authentication session'),
          )
        : resolve(),
    );
  });
}

function regenerateSession(sessionData: Express.Request['session']) {
  return new Promise<void>((resolve, reject) => {
    sessionData.regenerate((error) =>
      error
        ? reject(
            error instanceof Error
              ? error
              : new Error('Failed to regenerate authentication session'),
          )
        : resolve(),
    );
  });
}
