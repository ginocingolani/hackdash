import { deleteDashboard, getDashboard, updateDashboard, type DashboardPatch } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, jsonBody, publicJson, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ domain: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const { domain } = await params;
  return publicJson(await getDashboard(domain));
});

export const PUT = api<Ctx>(async (request, { params }) => {
  const uid = await requireUser();
  const { domain } = await params;
  const body = (await jsonBody(request)) as DashboardPatch;
  const dashboard = await updateDashboard(domain, uid, {
    title: body.title,
    description: body.description,
    link: body.link,
    open: body.open,
    showcase: body.showcase,
  });
  return NextResponse.json(dashboard);
});

export const DELETE = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { domain } = await params;
  await deleteDashboard(domain, uid);
  return new NextResponse(null, { status: 204 });
});
