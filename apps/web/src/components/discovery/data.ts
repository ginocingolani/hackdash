import {
  getSiteCounts,
  getTeam,
  listCollections,
  listDashboards,
  listProjects,
  searchUsers,
  type ProjectStatus,
  type SiteCounts,
} from "@hackdash/db";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/timeAgo";
import type {
  CollectionCardData,
  DashboardCardData,
  ProjectCardData,
  UserCardData,
} from "@/components/entities/cards";

// Server-side fetch + serialize helpers for the landing and discovery pages.
// Services return live mongoose documents; everything leaving this module is
// a plain, serializable card shape (docs/legacy conventions in cards.tsx).

export const PAGE_SIZE = 24;
export const LIMIT_MAX = 48;

export interface DiscoveryParams {
  q?: string;
  limit: number;
}

// ?q= and ?limit= from the (awaited) Next 16 searchParams promise.
export function parseDiscoveryParams(searchParams: {
  [key: string]: string | string[] | undefined;
}): DiscoveryParams {
  const qRaw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const q = qRaw?.trim() ? qRaw.trim().slice(0, 100) : undefined;
  const limitRaw = Number(
    Array.isArray(searchParams.limit) ? searchParams.limit[0] : searchParams.limit,
  );
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), LIMIT_MAX)
    : PAGE_SIZE;
  return { q, limit };
}

interface FetchOptions {
  q?: string;
  limit?: number;
}

export async function fetchDashboardCards(
  { q, limit }: FetchOptions,
  locale: string,
): Promise<DashboardCardData[]> {
  await db();
  const docs = await listDashboards({ q, limit, maxLimit: LIMIT_MAX });
  return docs.map((d) => ({
    domain: d.domain ?? "",
    title: d.title ?? null,
    description: d.description ?? null,
    cover: d.covers?.[0] ?? null,
    projectsCount: d.projectsCount ?? 0,
    createdAgo: timeAgo(d.created_at ?? new Date(), locale),
  }));
}

export async function fetchProjectCards(
  { q, limit }: FetchOptions,
  locale: string,
): Promise<ProjectCardData[]> {
  await db();
  const docs = await listProjects({ q, limit, maxLimit: LIMIT_MAX });
  return docs.map((p) => ({
    _id: String(p._id),
    title: p.title,
    domain: p.domain ?? null,
    description: p.description ?? null,
    status: (p.status ?? "brainstorming") as ProjectStatus,
    cover: p.cover ?? null,
    contributorsCount: p.contributors?.length ?? 0,
    createdAgo: timeAgo(p.created_at ?? new Date(), locale),
  }));
}

export async function fetchUserCards({ q, limit }: FetchOptions): Promise<UserCardData[]> {
  await db();
  const docs = await searchUsers({ q, limit, maxLimit: LIMIT_MAX });
  return docs.map((u) => ({
    _id: String(u._id),
    name: u.name || u.username || "—",
    username: u.username ?? null,
    picture: u.picture ?? null,
    bio: u.bio ?? null,
  }));
}

export type CollectionCardWithCount = CollectionCardData & { dashboardsCount: number };

export async function fetchCollectionCards(
  { q, limit }: FetchOptions,
  locale: string,
): Promise<CollectionCardWithCount[]> {
  await db();
  const docs = await listCollections({ q, limit, maxLimit: LIMIT_MAX });
  return docs.map((c) => ({
    _id: String(c._id),
    title: c.title ?? "—",
    description: c.description ?? null,
    createdAgo: timeAgo(c.created_at ?? new Date(), locale),
    dashboardsCount: c.dashboards?.length ?? 0,
  }));
}

export async function fetchSiteCounts(): Promise<SiteCounts> {
  await db();
  return getSiteCounts();
}

// Team strip members from the TEAM_USER_IDS env (comma-separated legacy user
// ids, order preserved). Empty env → empty array → the strip renders nothing.
export async function fetchTeam(): Promise<UserCardData[]> {
  const ids = (process.env.TEAM_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return [];
  await db();
  const users = await getTeam(ids);
  return users.map((u) => ({
    _id: String(u._id),
    name: u.name || u.username || "—",
    username: u.username ?? null,
    picture: u.picture ?? null,
    bio: u.bio ?? null,
  }));
}
