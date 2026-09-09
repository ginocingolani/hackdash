import { joinProject, leaveProject } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ pid: string }> };

export const POST = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { pid } = await params;
  await joinProject(pid, uid);
  return new NextResponse(null, { status: 204 });
});

export const DELETE = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { pid } = await params;
  await leaveProject(pid, uid);
  return new NextResponse(null, { status: 204 });
});
