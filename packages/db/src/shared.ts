// Client-safe surface of @hackdash/db: pure constants and types only.
// This module (and anything it imports) must NEVER touch mongoose — it is
// what browser bundles are allowed to see, via the "@hackdash/db/shared"
// subpath export. Client components import from the subpath; importing the
// package root pulls in the models, which crash in a browser bundle.

export { PROJECT_STATUSES, type ProjectStatus } from "./statuses";
export type { ServiceErrorCode } from "./errors";

// Loosened from the legacy /^[a-z0-9]{5,10}$/ — a strict superset, so every
// existing slug stays valid and names like "mediaparty26" fit.
export const DASHBOARD_DOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{2,30})[a-z0-9]$/;
