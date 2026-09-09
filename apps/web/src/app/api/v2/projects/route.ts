import { createProject, listProjects, type ProjectInput } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, jsonBody, publicJson, requireUser, searchOptions } from "@/lib/api";

export const GET = api(async (request) => {
  const projects = await listProjects(searchOptions(request));
  return publicJson(projects);
});

export const POST = api(async (request) => {
  const uid = await requireUser();
  const body = (await jsonBody(request)) as unknown as ProjectInput;
  const project = await createProject(uid, body);
  return NextResponse.json(project, { status: 201 });
});
