import { createDashboard, listDashboards } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, jsonBody, publicJson, requireUser, searchOptions } from "@/lib/api";

export const GET = api(async (request) => {
  const dashboards = await listDashboards(searchOptions(request));
  return publicJson(dashboards);
});

export const POST = api(async (request) => {
  const uid = await requireUser();
  const body = await jsonBody(request);
  const dashboard = await createDashboard(uid, String(body.domain ?? ""));
  return NextResponse.json(dashboard, { status: 201 });
});
