# GoForLift — Agent Instructions

## Project Overview

GoForLift is a full-stack workout application for creating workout routines,
executing workouts, and tracking workout history.

The project has three primary goals:

1. Build a useful workout application.
2. Demonstrate production-quality full-stack engineering for software engineering interviews.
3. Learn how to use AI coding agents effectively without relying on "vibe coding."

Although the initial application is relatively small and primarily intended for
personal use, engineering decisions should assume the application could grow to
support a large number of users.

Do not introduce unnecessary complexity solely to simulate a large-scale system.
Prefer simple designs that can evolve as requirements grow.


## Source of Truth

Before implementing a task, read the relevant documentation under `/docs`.

The following files define the project:

- `docs/requirements.md`
  - Product requirements and MVP scope.

- `docs/architecture.md`
  - System architecture and technical decisions.

- `docs/database.md`
  - Database model and persistence decisions.

- `docs/design.md`
  - UI, UX, theming, responsive design, and visual conventions.

These documents are the source of truth.

If implementation requirements conflict with these documents, do not silently
change the architecture or product behavior.

Instead:

1. Identify the conflict.
2. Explain the tradeoff.
3. Propose a change.
4. Wait for approval before making a significant architectural or product change.


## Engineering Philosophy

This project is intentionally not being developed through uncontrolled
AI-generated code.

Code should be:

- readable
- maintainable
- testable
- secure
- strongly typed
- appropriately documented
- easy for another engineer to understand

Prefer straightforward solutions over clever ones.

Avoid premature abstraction.

Do not introduce infrastructure or patterns simply because they might be useful
at hypothetical future scale.

Design components and modules so they can evolve if the application grows.


## Repository Architecture

GoForLift uses a pnpm monorepo.

Expected high-level structure:

    apps/
      web/
      api/

    packages/
      contracts/
      config/

    docs/

`apps/web` is the React frontend.

Within `apps/web/src`, use `app/` for application-wide composition such as the
protected shell, access boundary, and identity shared across routed features.
Keep `features/` reserved for product capabilities such as dashboard, routines,
workouts, and authentication.

`apps/api` is the Express backend.

`packages/contracts` contains code that represents contracts shared between the
frontend and backend when appropriate, particularly Zod schemas and inferred
TypeScript types.

`packages/config` may contain genuinely useful shared configuration. Do not move
configuration into this package merely for abstraction's sake.


## Code Organization

Prefer feature-based / vertical organization over large technical-layer folders.

For example:

    features/
      routines/
      workouts/
      exercises/
      history/

A feature may contain its own:

- components
- hooks
- services
- schemas
- tests
- types

when appropriate.

Code that is genuinely reusable across multiple features may live in shared
locations.

Do not create shared abstractions before there is a real reuse case.

Within a feature, use descriptive role suffixes when they make a file's
responsibility clearer, such as `.routes.ts`, `.service.ts`, `.middleware.ts`,
and `.schema.ts`. Colocate tests as `<name>.<role>.test.ts`. Group related
capabilities into focused subfolders when a feature grows; avoid broad files
such as `auth.service.ts` or empty layers created only to match a template.


## Frontend Standards

The frontend uses:

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- Vitest
- React Testing Library

Follow `docs/design.md` for UI and design decisions.

### State Management

Use the appropriate tool for the type of state.

TanStack Query:
- server state
- API fetching
- caching
- mutations

React Hook Form:
- form state

Zustand:
- cross-component client state where it provides clear value

React local state:
- state local to a component or small component subtree

Do not put all application state into Zustand.

Do not duplicate TanStack Query server state inside Zustand without a specific
reason.

### JSX Readability

Keep JSX focused on describing the rendered UI. Move non-trivial conditions,
calculations, and data transformations into clearly named values in the
component body before the `return`. Simple conditions that remain immediately
understandable may stay inline. Use blank lines to separate distinct groups of
component logic, such as state, derived values, event handlers, and render
conditions.


## UI Components

shadcn/ui provides low-level UI building blocks.

Tailwind CSS is used for styling and implementation of the project's visual
system.

Build reusable GoForLift components on top of these primitives when patterns
repeat.

Conceptually:

    Tailwind
        ↓
    shadcn/ui primitives
        ↓
    GoForLift shared UI components
        ↓
    feature components
        ↓
    pages

Avoid large amounts of duplicated Tailwind styling.

Do not abstract a component merely because it might theoretically be reused.


## Backend Standards

The backend uses:

- Node.js
- TypeScript
- Express 5
- Zod
- PostgreSQL
- Drizzle ORM
- Drizzle Kit
- Vitest

Keep HTTP concerns, business logic, and database access reasonably separated.

Do not put substantial business logic directly inside Express route handlers.

Validate untrusted input at application boundaries.

Use Zod for runtime validation where appropriate.


## TypeScript

TypeScript strict mode must remain enabled.

Avoid:

    any

unless there is a strong technical reason.

Prefer:

    unknown

when dealing with values whose type has not yet been established.

Do not bypass type errors using assertions simply to make the compiler pass.

Prefer inference when the resulting type remains clear.

In object type and interface declarations, list required properties before
optional properties.

Avoid duplicating types that can safely be inferred from Zod schemas or other
authoritative definitions.


## Shared Contracts

When the frontend and backend need the same request/response contract, prefer
defining the appropriate Zod schema in:

    packages/contracts

and infer TypeScript types from that schema.

Form validation that represents an API or domain constraint must reuse the
field schemas from `packages/contracts`. Do not recreate constraints such as
required values, trimming, minimums, maximums, or allowed values inside a
frontend feature. Frontend-only presentation behavior may wrap shared field
schemas in a form-specific object schema, but the underlying validation rules
must remain shared.

Example:

    export const CreateRoutineSchema = z.object({
      name: z.string().min(1)
    });

    export type CreateRoutineInput =
      z.infer<typeof CreateRoutineSchema>;

Do not force database-specific models into frontend contracts.

Database schemas and public API contracts are separate concepts.


## API Design

The application uses REST APIs.

API versioning is performed through headers rather than URL prefixes.

Follow the API conventions documented in `docs/architecture.md`.

Keep API URLs resource-oriented and predictable.

Use appropriate HTTP:

- methods
- status codes
- validation
- error responses

Do not expose internal database details unnecessarily through API responses.


## Database

PostgreSQL is the database.

Drizzle is the ORM/query layer.

Drizzle Kit manages migrations.

Database decisions must follow:

    docs/database.md

Do not change relationships or introduce new persistent entities without checking
the documented data model.

Schema changes should be performed through migrations.


## Security

Security is a first-class requirement.

At minimum:

- validate untrusted input
- enforce authorization server-side
- use secure authentication practices
- protect secrets
- avoid exposing sensitive implementation details
- use parameterized database access
- configure CORS intentionally
- consider CSRF protections where relevant to the chosen authentication model
- avoid leaking stack traces or internal errors to clients
- follow least-privilege principles

For MVP authentication:

- use Google OIDC for registered-user login
- use server-side sessions stored in PostgreSQL
- place only an opaque, cryptographically random session ID in an `HttpOnly`
  cookie
- set `Secure` in production and choose `SameSite`, domain, path, and expiration
  settings intentionally
- do not introduce JWT-based application authentication unless the documented
  architecture is deliberately changed
- enforce authentication and resource authorization on the server for every
  protected request
- invalidate the server-side session on logout and reject expired sessions
- implement CSRF protection appropriate for cookie-based authentication
- follow `docs/decisions/0002-authentication-security-policy.md` for the exact
  session lifetime, cookie, CORS, CSRF, proxy, and redirect policy
- use maintained OIDC and session-management libraries rather than implementing
  security protocols or session primitives from scratch

Never commit:

- passwords
- API keys
- access tokens
- database credentials
- production secrets

Environment-specific secrets belong in environment variables or an appropriate
secret-management system.

Provide `.env.example` files where useful without real secrets.


## Error Handling

Handle expected errors explicitly.

Backend errors should have predictable responses.

Unexpected backend errors should be logged while returning a safe response to
the client.

The frontend should have appropriate error handling and error boundaries.

Do not silently swallow errors.


## Testing

Tests should provide confidence rather than exist merely to increase coverage.

Use:

- Vitest for unit/integration tests
- React Testing Library for React behavior

Prioritize testing:

- business logic
- validation
- API behavior
- important user flows
- regressions
- edge cases

Avoid tests that depend heavily on implementation details.

Keep scenario-specific data local. Extract stable objects or configuration
repeated across test files into typed factories or fixtures under the relevant
application's `src/test/fixtures/` directory; prefer override-based factories
for domain variants and do not share fixtures across unrelated boundaries.

Do not weaken, remove, or rewrite a legitimate failing test merely to make a
change pass.

Fix the underlying behavior unless the requirement itself has changed.


## Code Quality

The repository uses:

- TypeScript strict mode
- ESLint
- Prettier

Before considering work complete, relevant checks should pass.

Expected root commands will include:

    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm format:check

When applicable:

    pnpm build

Do not disable lint or TypeScript rules merely to avoid fixing an issue without
explaining why.

### File Purpose Comments

Every new or modified source, configuration, and test file that supports
comments must begin with one concise comment describing the file's primary
responsibility.

The comment should explain the file's purpose, not restate its implementation.
Keep it accurate as the responsibility changes. Do not bulk-edit unrelated
existing files solely to add comments, and do not add comments to generated
files or formats that do not support them.


## Dependencies

Do not add a dependency automatically just because it makes a small task easier.

Before introducing a meaningful new dependency, consider:

- whether the platform or existing stack already solves the problem
- maintenance status
- security
- bundle/runtime cost
- ecosystem maturity
- whether the dependency meaningfully reduces complexity

If a task requires a significant new dependency not already established by the
project, explain why it is needed.


## Scope Control

Implement the requested task.

Do not opportunistically rewrite unrelated parts of the repository.

Do not perform large refactors unless they are necessary for the requested
change.

If you notice unrelated technical debt, mention it rather than silently expanding
the scope.


## Documentation

Update documentation when a change alters:

- architecture
- product behavior
- database design
- developer workflow
- important conventions

Do not allow implementation and documentation to knowingly diverge.


## AI Workflow

Treat AI-generated code exactly as code written by another engineer.

Generated code must still be:

- reviewed
- tested
- understandable
- consistent with project architecture

When completing a substantial task, provide a concise summary containing:

1. What changed.
2. Important implementation decisions.
3. Files added or significantly modified.
4. Tests added or changed.
5. Commands used to verify the work.
6. Any assumptions made.
7. Any unresolved questions or recommended follow-up work.

Do not claim that a command or test passed unless it was actually executed.


## Initial Development Rule

During repository bootstrap, do not implement GoForLift product features unless
explicitly requested.

Infrastructure setup should establish the foundation first.

The initial foundation should eventually support:

    pnpm install
    pnpm dev
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm format:check
    pnpm build

with:

- the React application running
- the Express application running
- local PostgreSQL running through Docker Compose
- the API able to connect to PostgreSQL


## GoForLift Principle

Build the simplest production-quality solution that satisfies the current
requirements and leaves reasonable room for future evolution.

Production quality does not mean maximum complexity.
