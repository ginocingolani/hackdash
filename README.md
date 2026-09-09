# HackDash

> Organize hackathon ideas into a dashboard.

This is the **modern rewrite** of [HackDash](https://hackdash.org), originally created by
[Dan Zajdband](https://github.com/impronunciable) and contributors
([impronunciable/hackdash](https://github.com/impronunciable/hackdash)). The rewrite
preserves the original domain model and data while replacing the 2015-era stack
(Node 0.10, Express + Jade, Backbone/Marionette, socket.io 0.9) with a modern,
maintainable one.

## Monorepo layout

```
apps/
  web/          Next.js app (UI + API routes)
packages/
  db/           Shared data layer (Mongoose 8 schemas ported from legacy)
docs/
  legacy/       Architecture map of the original codebase (the rewrite spec)
  decisions/    Architecture decision records
legacy/         The original application, preserved in-tree with full git
                history for traceability. Reference only — do not deploy.
```

This repository is a fork of [impronunciable/hackdash](https://github.com/impronunciable/hackdash);
the original commit history is preserved.

## Development

Requires Node >= 20.9 and pnpm (via corepack).

```sh
pnpm install
pnpm dev        # start the web app
pnpm build      # build all workspaces
pnpm lint
pnpm typecheck
pnpm test
```

## Project phases

1. **Map** the legacy system (see `docs/legacy/`).
2. **Modernize**: reach feature parity on the new stack with the existing data.
3. **Improve**: new features, only after parity is robust.

## License

MIT — see [LICENSE](./LICENSE). Original work © 2015 Dan Zajdband.
