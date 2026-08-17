# ADR 0002: Authentication Security Policy

## Status

Accepted

## Context

GoForLift uses Google OIDC and PostgreSQL-backed server-side sessions. The
security-sensitive session, cookie, CORS, CSRF, proxy, and redirect behavior
must be explicit before authentication middleware is implemented.

The production hosting platform and final hostnames have not yet been selected.
Production origins therefore come from validated configuration rather than
being hard-coded.

## Decision

### Origins and transport

- Local web origin: `http://localhost:5173`.
- Local API origin: `http://localhost:3000`.
- Production web and API origins must be explicit HTTPS URLs supplied through
  validated environment configuration.
- A deployment should keep the web and API on the same site when practical.

### Session lifetime

- Registered-user sessions have a fixed seven-day absolute lifetime.
- The MVP has no idle timeout and does not use rolling renewal.
- Activity must not extend the absolute expiration.
- Expired sessions fail closed and are pruned from PostgreSQL at least daily.
- Successful login regenerates the session ID; logout destroys the server-side
  session and clears the cookie.

### Session cookie

The cookie is named `goforlift.sid` and contains only an opaque session ID.

| Setting | Local development | Production |
| --- | --- | --- |
| `HttpOnly` | `true` | `true` |
| `Secure` | `false` | `true` |
| `SameSite` | `Lax` | `Lax` |
| `Path` | `/` | `/` |
| `Domain` | omitted (host-only) | omitted (host-only) |
| `Max-Age` | seven days | seven days |

`SameSite=Lax` permits the top-level navigation back from Google while reducing
cross-site cookie sending. A future cross-site web/API deployment must trigger a
new review; it must not silently weaken this policy to `SameSite=None`.

### Trusted proxy

- Local development does not trust a proxy.
- Production enables Express `trust proxy` only when deployed behind the known
  HTTPS-terminating reverse proxy, using the narrowest setting supported by the
  selected platform.
- The final value is deployment configuration and must never default to trusting
  arbitrary forwarding headers.

### Credentialed CORS

- The API allowlist contains only the configured web origin.
- Credentials are enabled so the browser can send the session cookie.
- A wildcard origin is never combined with credentials.
- Requests with missing or unapproved origins are rejected where CORS applies.
- Allowed methods and headers are limited to those used by the API, including
  `X-CSRF-Token` for protected requests.

### CSRF protection

GoForLift uses a synchronizer token stored in the server-side session and sent
to the browser through a dedicated endpoint. The browser returns it in the
`X-CSRF-Token` header.

CSRF validation is required for every cookie-authenticated `POST`, `PUT`,
`PATCH`, and `DELETE` request, including logout. Safe read-only methods do not
require the token. The Google callback is protected by OIDC state, nonce, and
PKCE validation; it does not rely on the synchronizer token.

Missing, invalid, or expired tokens fail closed. Tokens and session contents
must never be logged.

### Post-login redirects

- The client may supply only a root-relative application path beginning with a
  single `/`.
- Absolute URLs, protocol-relative values such as `//example.com`, backslashes,
  encoded bypasses, and non-HTTP navigation schemes are rejected.
- Invalid or missing destinations fall back to `/`.
- The validated destination is protected by the OIDC flow state and revalidated
  before redirecting after login.

## Consequences

- Authentication behavior is deterministic across environments.
- Sessions end after seven days even when actively used; renewal can be added
  later as a separate product and security decision.
- A hosting topology that requires cross-site cookies needs an explicit policy
  review.
- Production configuration must provide exact HTTPS origins and proxy behavior.

## References

- GitHub issue #4: Finalize session, cookie, CORS, and CSRF policy
- `docs/decisions/0001-authentication-libraries.md`
