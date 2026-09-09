import { NextResponse, type NextRequest } from "next/server";

// Subdomain handling (legacy parity, docs/legacy/client.md §2): a request to
// {sub}.{root} redirects to {root}/dashboards/{sub}. The root host comes from
// env SITE_URL. Deliberately conservative — on any parse doubt the request
// passes through untouched.

// Same shape the dashboard service accepts for domains (kept inline: the
// proxy bundle must not pull in mongoose via @hackdash/db).
const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{2,30})[a-z0-9]$/;

const SKIPPED_SUBDOMAINS = new Set(["www", "api"]);

function siteUrl(): URL | null {
  try {
    return new URL(process.env.SITE_URL || "http://localhost:3000");
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const site = siteUrl();
  if (!site) return NextResponse.next();
  const root = site.hostname.toLowerCase();

  // Host without port; hostname on NextRequest.nextUrl can reflect the
  // internal server, so prefer the Host header the client actually sent.
  const rawHost = request.headers.get("host") ?? request.nextUrl.hostname;
  const host = rawHost.split(":")[0].trim().toLowerCase();
  if (!host || host === root) return NextResponse.next();
  if (!host.endsWith(`.${root}`)) return NextResponse.next();

  const sub = host.slice(0, -(root.length + 1));
  // Only single-label, dashboard-shaped subdomains redirect; anything else
  // (www, api, nested labels, malformed) passes through.
  if (sub.includes(".") || SKIPPED_SUBDOMAINS.has(sub) || !SUBDOMAIN_REGEX.test(sub)) {
    return NextResponse.next();
  }

  // Asset and API paths keep working on the subdomain host.
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/embed/") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Redirect to the canonical SITE_URL origin (its scheme and port).
  return NextResponse.redirect(new URL(`/dashboards/${sub}`, site), 302);
}

export const config = {
  // Skip API routes, Next internals and any path that looks like a file.
  matcher: ["/((?!api/|_next/|favicon\\.ico|.*\\..*).*)"],
};
