import { deleteProject, getProject, updateProject, type ProjectInput } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, jsonBody, publicJson, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ pid: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const { pid } = await params;
  return publicJson(await getProject(pid));
});

export const PUT = api<Ctx>(async (request, { params }) => {
  const uid = await requireUser();
  const { pid } = await params;
  const body = (await jsonBody(request)) as Omit<ProjectInput, "domain">;
  const project = await updateProject(pid, uid, body);
  return NextResponse.json(project);
});

export const DELETE = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { pid } = await params;
  await deleteProject(pid, uid);
  return new NextResponse(null, { status: 204 });
});
