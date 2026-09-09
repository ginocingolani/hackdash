import { listProjects } from "@hackdash/db";
import { api, publicJson, searchOptions } from "@/lib/api";

type Ctx = { params: Promise<{ domain: string }> };

export const GET = api<Ctx>(async (request, { params }) => {
  const { domain } = await params;
  const projects = await listProjects({ ...searchOptions(request), domain });
  return publicJson(projects);
});
