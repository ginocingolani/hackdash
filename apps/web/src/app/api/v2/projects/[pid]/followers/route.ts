import { followProject, unfollowProject } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ pid: string }> };

export const POST = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { pid } = await params;
  await followProject(pid, uid);
  return new NextResponse(null, { status: 204 });
});

export const DELETE = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { pid } = await params;
  await unfollowProject(pid, uid);
  return new NextResponse(null, { status: 204 });
});
