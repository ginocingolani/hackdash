import { createCollection, listCollections } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, jsonBody, publicJson, requireUser, searchOptions } from "@/lib/api";

export const GET = api(async (request) => {
  const { q, limit, maxLimit } = searchOptions(request);
  return publicJson(await listCollections({ q, limit, maxLimit }));
});

export const POST = api(async (request) => {
  const uid = await requireUser();
  const body = await jsonBody(request);
  const collection = await createCollection(uid, {
    title: body.title as string | undefined,
    description: body.description as string | undefined,
  });
  return NextResponse.json(collection, { status: 201 });
});
