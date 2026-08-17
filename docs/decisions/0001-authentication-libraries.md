# ADR 0001: Authentication Libraries

## Status

Accepted


## Context

GoForLift needs Google OpenID Connect login for a React web application backed
by one Express 5 API and PostgreSQL database.

The documented authentication architecture requires:

- Google OIDC for registered-user identity
- PostgreSQL-backed server-side sessions
- an opaque session ID in an `HttpOnly` cookie
- CSRF protection for state-changing requests
- no GoForLift-issued JWT authentication for the MVP
- maintained libraries instead of custom protocol or session implementations

The repository uses ESM, TypeScript, Node.js, Express 5, `pg`, Drizzle, and pnpm.
Selected libraries must fit that stack without introducing unnecessary identity
infrastructure or overlapping abstractions.


## Decision Drivers

- Correct implementation of OIDC validation and Authorization Code Flow
- Active maintenance and a documented security policy
- Express 5, ESM, TypeScript, and current Node.js compatibility
- PostgreSQL session persistence without another infrastructure service
- Explicit session revocation and expiration behavior
- A CSRF design appropriate for stateful cookie authentication
- Minimal conceptual and operational complexity for one web client and one API
- Clear boundaries between protocol handling, session lifecycle, persistence,
  and application authorization


## Decision

Use the following libraries for MVP authentication:

Selected package baselines, verified on August 17, 2026:

- `openid-client` `^6.8.5`
- `express-session` `^1.19.0`
- `connect-pg-simple` `^10.0.0`
- `csrf-sync` `^4.2.1`

These are the reviewed starting versions. The lockfile remains authoritative for
the exact installed dependency graph, and dependency updates still require normal
review and automated verification.

### `openid-client`

Use `openid-client` for:

- Google OIDC discovery
- Authorization Code Flow
- PKCE generation and verification
- state and nonce validation
- authorization response and ID-token claim validation

GoForLift will identify a Google user by the stable `sub` claim. Email is profile
and contact data, not the canonical external identity key.


### `express-session`

Use `express-session` for:

- session ID generation and cookie handling
- typed server-side session state
- session ID regeneration after successful login
- session destruction during logout

Configure it with:

- `resave: false`
- `saveUninitialized: false`
- an explicit production cookie policy
- a production PostgreSQL store rather than the default memory store

The session contains only the GoForLift state needed for authentication and the
OIDC/CSRF flows. Google access tokens and ID tokens are not retained after login
unless a future Google API integration creates a specific requirement.


### `connect-pg-simple`

Use `connect-pg-simple` as the `express-session` PostgreSQL store.

It will reuse the API's existing `pg` connection pool. Drizzle owns the session
table migration, so `createTableIfMissing` remains disabled. Expiration and
pruning behavior must match the documented session policy.


### `csrf-sync`

Use `csrf-sync` to implement the synchronizer-token pattern for state-changing
cookie-authenticated requests.

The CSRF token is stored in the server-side session and returned through a
dedicated API response. The React client sends it in the `X-CSRF-Token` header.
Safe HTTP methods must not perform state changes.


## Alternatives Considered

### Passport with a Google or OIDC strategy

Rejected for the MVP.

Passport would add a second authentication abstraction around protocol behavior
already handled by `openid-client`. GoForLift currently has one identity provider
and does not need Passport's strategy ecosystem.


### Google's authentication libraries alone

Rejected as the primary browser OIDC integration.

Google libraries can verify Google tokens, but GoForLift also needs a complete,
stateful Authorization Code Flow with discovery, PKCE, state, nonce, callback
validation, and application session creation. `openid-client` provides a more
complete OIDC relying-party boundary.


### Custom OIDC implementation

Rejected.

OIDC and OAuth contain security-sensitive validation and protocol edge cases.
Implementing these directly would increase risk and maintenance cost without
providing product value.


### Custom Drizzle session store

Rejected initially.

A custom `express-session` store would provide tighter control over the table
shape but would require GoForLift to own store semantics such as `get`, `set`,
`destroy`, `touch`, expiration, concurrency behavior, and error handling. The
maintained PostgreSQL adapter is simpler for the MVP.


### Redis session storage

Deferred.

GoForLift already requires PostgreSQL, and expected MVP traffic does not justify
another service. The session store can be revisited if measured database load or
deployment requirements make Redis valuable.


### Stateless application JWTs

Rejected for the MVP.

GoForLift has one browser client and one backend. JWTs would complicate immediate
logout and revocation without solving a current distributed-system requirement.
Google may issue a JWT-formatted ID token during OIDC, but that provider token is
not the GoForLift application session.


### Double-submit CSRF protection

Rejected for the current stateful architecture.

The synchronizer-token pattern naturally uses the server-side session already
required by the application. A double-submit design would be more appropriate
for an otherwise stateless system.


## Consequences

### Positive

- Security-sensitive OIDC behavior is delegated to a focused, maintained client.
- Logout and revocation remain straightforward server-side operations.
- Sessions reuse PostgreSQL and the existing connection pool.
- Each library has one clear responsibility.
- The architecture remains simple enough for the MVP and explainable in review.


### Negative

- Authenticated requests require a PostgreSQL session lookup.
- The session table must be migrated, indexed, pruned, and monitored.
- Cookie authentication requires intentional CSRF and CORS configuration.
- `connect-pg-simple` uses its own compatible session record shape rather than a
  domain-specific normalized session model.
- A future native or third-party client may require a different token strategy.


## Follow-up Decisions

Before session middleware is implemented, finalize:

- local and production frontend/API origins
- cookie `SameSite`, `Secure`, domain, path, and name
- absolute session lifetime, idle timeout, and renewal behavior
- trusted proxy configuration
- credentialed CORS allowlist
- safe post-login redirect rules
- expired-session pruning policy

These decisions are tracked separately because they depend on the deployment
topology rather than the library selection itself.


## References

- GitHub issue #3: Select and document authentication libraries
- `docs/architecture.md`
- `docs/database.md`
- `docs/requirements.md`
