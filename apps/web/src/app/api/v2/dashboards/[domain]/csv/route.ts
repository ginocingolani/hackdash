import { buildDashboardCsv, isDashboardAdmin, ServiceError } from "@hackdash/db";
import { api, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ domain: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { domain } = await params;
  if (!(await isDashboardAdmin(uid, domain))) throw new ServiceError("forbidden", 403);
  const csv = await buildDashboardCsv(domain);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${domain}.csv"`,
    },
  });
});
