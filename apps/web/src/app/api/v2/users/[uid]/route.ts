import { getUser } from "@hackdash/db";
import { currentUserId } from "@/auth";
import { api, publicJson } from "@/lib/api";

type Ctx = { params: Promise<{ uid: string }> };

export const GET = api<Ctx>(async (_request, { params }) => {
  const { uid } = await params;
  const actor = await currentUserId();
  return publicJson(await getUser(uid, actor ?? undefined));
});
