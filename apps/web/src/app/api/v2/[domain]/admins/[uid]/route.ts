import { grantAdmin, revokeAdmin } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ domain: string; uid: string }> };

export const POST = api<Ctx>(async (_request, { params }) => {
  const actor = await requireUser();
  const { domain, uid } = await params;
  await grantAdmin(domain, actor, uid);
  return new NextResponse(null, { status: 204 });
});

// New in the rewrite: legacy had no way to revoke an admin grant.
export const DELETE = api<Ctx>(async (_request, { params }) => {
  const actor = await requireUser();
  const { domain, uid } = await params;
  await revokeAdmin(domain, actor, uid);
  return new NextResponse(null, { status: 204 });
});
