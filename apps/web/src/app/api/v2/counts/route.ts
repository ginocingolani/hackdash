import { getSiteCounts, type SiteCounts } from "@hackdash/db";
import { api, publicJson } from "@/lib/api";

// Replaces the legacy unauthenticated /counts file read (bug #8): live
// aggregates, deliberately public, cached in-process for 5 minutes.
let cache: { at: number; data: SiteCounts } | null = null;
const TTL_MS = 5 * 60 * 1000;

export const GET = api(async () => {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    cache = { at: Date.now(), data: await getSiteCounts() };
  }
  return publicJson(cache.data);
});
