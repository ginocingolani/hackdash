import type {
  CollectionCardData,
  DashboardCardData,
  ProjectCardData,
} from "@/components/entities/cards";
import type { ProjectStatus } from "@hackdash/db/shared";
import { PROJECT_STATUSES } from "@hackdash/db/shared";
import { timeAgo } from "@/lib/timeAgo";

// Serializers from service-layer documents (hydrated or lean) to the plain
// shapes the shared entity cards expect. Used by the profile pages and the
// collection page; inputs are typed structurally so both mongoose documents
// and toObject() results fit.

interface Timestamped {
  created_at?: Date | string | null;
}

export interface DashboardDocLike extends Timestamped {
  _id: unknown;
  domain?: string | null;
  title?: string | null;
  description?: string | null;
  covers?: string[] | null;
  projectsCount?: number | null;
}

/** Card data plus the document id (needed for collection add/remove). */
export interface DashboardEntry {
  id: string;
  card: DashboardCardData;
}

function ago(value: Date | string | null | undefined, locale: string): string {
  return timeAgo(value ?? new Date(), locale);
}

export function toDashboardEntry(doc: DashboardDocLike, locale: string): DashboardEntry {
  return {
    id: String(doc._id),
    card: {
      domain: doc.domain ?? "",
      title: doc.title ?? null,
      description: doc.description ?? null,
      cover: doc.covers?.[0] ?? null,
      projectsCount: doc.projectsCount ?? 0,
      createdAgo: ago(doc.created_at, locale),
    },
  };
}

export interface ProjectDocLike extends Timestamped {
  _id: unknown;
  title?: string | null;
  domain?: string | null;
  description?: string | null;
  status?: string | null;
  cover?: string | null;
  contributors?: unknown[] | null;
}

export function toProjectCard(doc: ProjectDocLike, locale: string): ProjectCardData {
  const status = PROJECT_STATUSES.includes(doc.status as ProjectStatus)
    ? (doc.status as ProjectStatus)
    : PROJECT_STATUSES[0];
  return {
    _id: String(doc._id),
    title: doc.title ?? "",
    domain: doc.domain ?? null,
    description: doc.description ?? null,
    status,
    cover: doc.cover ?? null,
    contributorsCount: doc.contributors?.length ?? 0,
    createdAgo: ago(doc.created_at, locale),
  };
}

export interface CollectionDocLike extends Timestamped {
  _id: unknown;
  title?: string | null;
  description?: string | null;
  dashboards?: unknown[] | null;
}

/** Card data plus the dashboard count (the card label is localized by the page). */
export interface CollectionEntry {
  card: CollectionCardData;
  dashboardsCount: number;
}

export function toCollectionEntry(doc: CollectionDocLike, locale: string): CollectionEntry {
  return {
    card: {
      _id: String(doc._id),
      title: doc.title?.trim() || "Untitled collection",
      description: doc.description ?? null,
      createdAgo: ago(doc.created_at, locale),
    },
    dashboardsCount: doc.dashboards?.length ?? 0,
  };
}

/** Structural shape of the getProfile() aggregate from @hackdash/db. */
export interface ProfileAggregate extends Timestamped {
  _id: unknown;
  name?: string | null;
  username?: string | null;
  picture?: string | null;
  bio?: string | null;
  email?: string | null;
  collections: CollectionDocLike[];
  dashboards: DashboardDocLike[];
  projects: ProjectDocLike[];
  contributions: ProjectDocLike[];
  likes: ProjectDocLike[];
}

export interface SerializedProfile {
  id: string;
  name: string;
  username?: string | null;
  picture?: string | null;
  bio?: string | null;
  joinedAgo?: string | null;
  collections: CollectionEntry[];
  dashboards: DashboardEntry[];
  projects: ProjectCardData[];
  contributions: ProjectCardData[];
  following: ProjectCardData[];
}

export function serializeProfile(profile: ProfileAggregate, locale: string): SerializedProfile {
  return {
    id: String(profile._id),
    name: profile.name ?? "?",
    username: profile.username ?? null,
    picture: profile.picture ?? null,
    bio: profile.bio ?? null,
    joinedAgo: profile.created_at ? ago(profile.created_at, locale) : null,
    collections: profile.collections.map((c) => toCollectionEntry(c, locale)),
    dashboards: profile.dashboards.map((d) => toDashboardEntry(d, locale)),
    projects: profile.projects.map((p) => toProjectCard(p, locale)),
    contributions: profile.contributions.map((p) => toProjectCard(p, locale)),
    following: profile.likes.map((p) => toProjectCard(p, locale)),
  };
}
