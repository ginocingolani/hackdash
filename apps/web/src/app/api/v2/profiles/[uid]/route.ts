import { getProfile, updateProfile } from "@hackdash/db";
import { NextResponse } from "next/server";
import { currentUserId } from "@/auth";
import { api, jsonBody, publicJson, requireUser } from "@/lib/api";

type Ctx = { params: Promise<{ uid: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const { uid } = await params;
  const actor = await currentUserId();
  return publicJson(await getProfile(uid, actor ?? undefined));
});

export const PUT = api<Ctx>(async (request, { params }) => {
  const actor = await requireUser();
  const { uid } = await params;
  const body = await jsonBody(request);
  const user = await updateProfile(uid, actor, {
    name: body.name as string | undefined,
    email: body.email as string | undefined,
    bio: body.bio as string | undefined,
  });
  return NextResponse.json(user);
});
