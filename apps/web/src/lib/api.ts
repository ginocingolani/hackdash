import { NextResponse } from "next/server";
import { ServiceError } from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "./db";
import { env } from "./env";

// Legacy /api/v2 was public with wide-open CORS on reads; embeds and
// third-party consumers rely on that, so public GETs keep it.
export const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

type Handler<Ctx> = (request: Request, ctx: Ctx) => Promise<Response>;

// Connects the database and maps ServiceError codes onto the legacy JSON
// error shape ({ error: <code> }) with proper HTTP statuses.
export function api<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, ctx) => {
    try {
      await db();
      return await handler(request, ctx);
    } catch (error) {
      if (error instanceof ServiceError) {
        return NextResponse.json({ error: error.code }, { status: error.status });
      }
      console.error(error);
      return NextResponse.json({ error: "internal" }, { status: 500 });
    }
  };
}

// Legacy contract: 401 { error: "not_authenticated" } for unauthenticated writes.
export async function requireUser(): Promise<string> {
  const uid = await currentUserId();
  if (!uid) throw new ServiceError("not_authenticated", 401);
  return uid;
}

export function searchOptions(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const limitRaw = Number(url.searchParams.get("limit"));
  const pageRaw = Number(url.searchParams.get("page"));
  return {
    q,
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined,
    page: Number.isFinite(pageRaw) && pageRaw >= 0 ? pageRaw : 0,
    maxLimit: env.maxQueryLimit,
  };
}

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const publicJson = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, { ...init, headers: { ...CORS_HEADERS, ...init?.headers } });
