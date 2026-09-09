import { NextResponse } from "next/server";

// Legacy short URL: /d/:domain → /dashboards/:domain (docs/legacy/client.md §3 item 42).
export async function GET(request: Request, ctx: { params: Promise<{ domain: string }> }) {
  const { domain } = await ctx.params;
  return NextResponse.redirect(
    new URL(`/dashboards/${encodeURIComponent(domain)}`, request.url),
    302
  );
}
