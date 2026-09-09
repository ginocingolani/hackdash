import { searchUsers } from "@hackdash/db";
import { api, publicJson, searchOptions } from "@/lib/api";

export const GET = api(async (request) => {
  const { q, limit, maxLimit } = searchOptions(request);
  return publicJson(await searchUsers({ q, limit, maxLimit }));
});
