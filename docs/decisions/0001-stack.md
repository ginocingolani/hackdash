# ADR 0001 — Stack for the rewrite

**Status:** accepted · **Date:** 2026-09-09

## Context

The legacy codebase (impronunciable/hackdash) targets Node 0.10 with Express 4.12,
Jade, Mongoose 5, Passport 0.2, socket.io 0.9, and a Backbone/Marionette +
Handlebars client built with Grunt/Browserify. Every layer is end-of-life and the
gap is too wide for incremental upgrades; we rewrite from scratch, treating the
legacy code as the spec (see `docs/legacy/`).

## Decision

- **Monorepo:** pnpm workspaces (`apps/*`, `packages/*`).
- **App:** Next.js (App Router) + TypeScript strict + Tailwind, in `apps/web`.
  UI and API routes live together; server-rendered pages replace the legacy
  prerender-based SEO service entirely.
- **Database:** keep **MongoDB**, accessed via **Mongoose 8** in `packages/db`.
  Rationale: hackdash.org has live production data; keeping the same store and
  porting schemas field-for-field makes migration non-destructive and reversible.
  A move to Postgres can be reconsidered *after* feature parity.
- **Auth:** Auth.js (next-auth) replacing Passport. GitHub OAuth first-class;
  legacy Twitter/Facebook/Meetup accounts handled via an account-linking
  migration path (many of those provider APIs no longer work as configured in
  legacy anyway).
- **Real-time:** start with polling/SSE for the live feed; socket.io 4 only if
  SSE proves insufficient.
- **Testing:** Vitest (+ Playwright later for e2e).

## Consequences

- Feature parity is the explicit gate before any new features (project phase 2 → 3).
- Legacy embed widget and API consumers need a documented compatibility story
  before hackdash.org itself is switched over.
