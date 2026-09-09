import { addDashboardToCollection, removeDashboardFromCollection } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ cid: string; did: string }> };

export const POST = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { cid, did } = await params;
  await addDashboardToCollection(cid, uid, did);
  return new NextResponse(null, { status: 204 });
});

export const DELETE = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { cid, did } = await params;
  await removeDashboardFromCollection(cid, uid, did);
  return new NextResponse(null, { status: 204 });
});
