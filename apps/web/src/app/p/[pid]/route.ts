import { NextResponse } from "next/server";

// Legacy short URL: /p/:pid → /projects/:pid (docs/legacy/client.md §3 item 42).
export async function GET(request: Request, ctx: { params: Promise<{ pid: string }> }) {
  const { pid } = await ctx.params;
  return NextResponse.redirect(new URL(`/projects/${encodeURIComponent(pid)}`, request.url), 302);
}
