# HackDash monorepo — working notes

Rewrite of hackdash.org. The original app lives in `legacy/` (reference only —
never deploy or edit it); `docs/legacy/` maps it and is the parity spec.
Phasing: foundation (done) → parity features → new features. Design follows the
Media Party system (`docs/design/media-party-design-system.md`, ADR 0002).

## Commands

```sh
pnpm install / build / lint / typecheck / test   # any directory; recurses
pnpm --filter @hackdash/db seed -- --admin <email>
pnpm --filter @hackdash/db exec tsx scripts/dev-mongod.mts  # throwaway local MongoDB
pnpm --filter @hackdash/web dev
```

Copy `apps/web/.env.example` to `apps/web/.env.local`; only `MONGODB_URI` and
`AUTH_SECRET` are required in dev (magic links print to the console).

## Conventions & gotchas

- **Mongoose is CommonJS.** Always `import mongoose from "mongoose"` and use
  `mongoose.Schema` / `mongoose.model` / `mongoose.models` (types may be named
  imports). Named *value* imports pass in Vitest (its interop is lenient) but
  crash under real Node ESM — `pnpm test` in `packages/db` runs an ESM import
  check (`scripts/check-esm.mts`) that catches this.
- **Never add a `pnpm-workspace.yaml` or lockfile inside a package.**
  Scaffolders (create-next-app) may drop one; delete it — a nested workspace
  root breaks dependency resolution for the whole app.
- **Next.js 16**: consult `apps/web/node_modules/next/dist/docs/` before app
  code — async `params`/`cookies`, `proxy.ts` (not `middleware.ts`), Turbopack.
- **Legacy compatibility is a contract**: `/api/v2` shapes, error codes
  (`subdomain_inuse`, …), `/embed/*` params, and Mongo field names must match
  `docs/legacy/server.md`. Business logic lives in `packages/db` services —
  route handlers stay thin. The 12 legacy bugs (server.md §9) each have a
  regression test; don't reintroduce them.
- Data in the `users`, `projects`, `dashboards`, `collections` collections is
  production-shaped legacy data; schema changes must be additive.
