import { listOwnCollections } from "@hackdash/db";
import { NextResponse } from "next/server";
import { api, requireUser } from "@/lib/api";

// Legacy bug #7: this endpoint had no auth guard and crashed for anonymous
// callers. It now requires a session.
export const GET = api(async () => {
  const uid = await requireUser();
  return NextResponse.json(await listOwnCollections(uid));
});
