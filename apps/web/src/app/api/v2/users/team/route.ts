import { getTeam } from "@hackdash/db";
import { api, publicJson } from "@/lib/api";

// Legacy read `config.team`; the rewrite reads TEAM_USER_IDS (comma-separated
// user ids) until the site.json content file arrives with the design phase.
export const GET = api(async () => {
  const ids = (process.env.TEAM_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return publicJson(ids.length ? await getTeam(ids) : []);
});
