import { deleteCollection, getCollection, updateCollection } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, jsonBody, publicJson, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ cid: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const { cid } = await params;
  return publicJson(await getCollection(cid));
});

export const PUT = api<Ctx>(async (request, { params }) => {
  const uid = await requireUser();
  const { cid } = await params;
  const body = await jsonBody(request);
  const collection = await updateCollection(cid, uid, {
    title: body.title as string | undefined,
    description: body.description as string | undefined,
  });
  return NextResponse.json(collection);
});

export const DELETE = api<Ctx>(async (_request, { params }) => {
  const uid = await requireUser();
  const { cid } = await params;
  await deleteCollection(cid, uid);
  return new NextResponse(null, { status: 204 });
});
