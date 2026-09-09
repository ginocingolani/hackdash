import type { ProjectStatus } from "@hackdash/db";
import { PROJECT_STATUSES } from "@hackdash/db";

// Legacy embed contract (docs/legacy/client.md §3 items 40-41): query-param
// parsing and the client-side filter/sort pipeline the legacy embedApp ran,
// reproduced server-side. Hiding is done by NOT rendering the element.

export type EmbedSearchParams = Record<string, string | string[] | undefined>;

export function firstParam(sp: EmbedSearchParams, key: string): string | undefined {
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

/** `hide=` comma list → set of hide tokens. */
export function hideSet(sp: EmbedSearchParams): Set<string> {
  return new Set(
    (firstParam(sp, "hide") ?? "")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

/** `slider=1..6` → column count, or null when absent/invalid. */
export function sliderColumns(sp: EmbedSearchParams): number | null {
  const raw = Number(firstParam(sp, "slider"));
  if (!Number.isInteger(raw)) return null;
  return raw >= 1 && raw <= 6 ? raw : null;
}

// ---------------------------------------------------------------------------
// Serialized project shape for the embed views (plain data, no mongoose docs).

export interface EmbedUser {
  _id: string;
  name: string;
  picture: string | null;
}

export interface EmbedProject {
  _id: string;
  title: string;
  domain: string | null;
  description: string;
  status: ProjectStatus;
  cover: string | null;
  link: string | null;
  tags: string[];
  createdAt: string; // ISO
  contributors: EmbedUser[];
  contributorsCount: number;
  followersCount: number;
}

interface RawUser {
  _id: unknown;
  name?: string;
  picture?: string;
}

interface RawProject {
  _id: unknown;
  title?: string;
  domain?: string | null;
  description?: string;
  status?: string;
  cover?: string;
  link?: string;
  tags?: unknown;
  created_at?: Date;
  contributors?: RawUser[];
  followers?: unknown[];
}

function toEmbedUser(user: RawUser): EmbedUser {
  return {
    _id: String(user._id),
    name: user.name ?? "?",
    picture: user.picture ?? null,
  };
}

export function serializeProject(doc: unknown): EmbedProject {
  const raw = doc as RawProject;
  const contributors = (raw.contributors ?? []).map(toEmbedUser);
  const status = PROJECT_STATUSES.includes(raw.status as ProjectStatus)
    ? (raw.status as ProjectStatus)
    : PROJECT_STATUSES[0];
  return {
    _id: String(raw._id),
    title: raw.title ?? "",
    domain: raw.domain ?? null,
    description: raw.description ?? "",
    status,
    cover: raw.cover || null,
    link: raw.link || null,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    createdAt: (raw.created_at ?? new Date()).toISOString(),
    contributors,
    contributorsCount: contributors.length,
    followersCount: raw.followers?.length ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Filter + sort pipeline (order matches the legacy embed view: query filter,
// then status filter, then sort).

const escapeRegex = (value: string) => value.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");

export function applyEmbedParams(
  projects: EmbedProject[],
  showcase: string[],
  sp: EmbedSearchParams
): EmbedProject[] {
  let list = projects;

  const query = firstParam(sp, "query");
  if (query) {
    const rx = new RegExp(escapeRegex(query), "i");
    list = list.filter(
      (p) => rx.test(p.title) || rx.test(p.description) || rx.test(p.tags.join(" "))
    );
  }

  const status = firstParam(sp, "status");
  if (status) {
    list = list.filter((p) => p.status === status);
  }

  const sort = firstParam(sp, "sort");
  switch (sort) {
    case "name":
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "showcase": {
      // Legacy: only projects in the dashboard's ordered showcase[] are
      // "active"; showcase sort shows them in showcase order. An empty
      // showcase means every project is active and the order is untouched.
      if (showcase.length > 0) {
        const position = new Map(showcase.map((id, i) => [id, i]));
        list = list
          .filter((p) => position.has(p._id))
          .sort((a, b) => (position.get(a._id) ?? 0) - (position.get(b._id) ?? 0));
      }
      break;
    }
    case "date":
    default:
      // Service order is already created_at desc; make it explicit so a
      // query/status-filtered list stays date-sorted too.
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }

  return list;
}
