import { listAdmins } from "@hackdash/db";
import { api, publicJson } from "@/lib/api";

type Ctx = { params: Promise<{ domain: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const { domain } = await params;
  return publicJson(await listAdmins(domain));
});
