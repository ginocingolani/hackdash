import Link from "next/link";
import type { ProjectStatus } from "@hackdash/db";
import { Card } from "@/components/ui/Card";
import { StatusBar } from "@/components/ui/StatusBar";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { coverGradient } from "./coverFallback";

// Shared entity cards used by discovery, dashboard walls, collections and
// profiles. Server components; props are plain serializable shapes (pass
// lean/serialized documents, not live mongoose docs).

function Cover({ src, seed, label }: { src?: string | null; seed: string; label?: string }) {
  return (
    <div
      className="relative flex h-32 items-end overflow-hidden"
      style={src ? undefined : { background: coverGradient(seed) }}
    >
      {src ? (
        // Arbitrary remote hosts (legacy data) — plain img by design.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {label ? (
        <span className="relative m-2 rounded-md bg-mp-ink/80 px-2 py-0.5 text-xs font-semibold tracking-wide text-mp-white uppercase">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export interface ProjectCardData {
  _id: string;
  title: string;
  domain?: string | null;
  description?: string | null;
  status: ProjectStatus;
  cover?: string | null;
  contributorsCount: number;
  createdAgo: string; // pre-localized by the page (timeAgo helper)
}

export function ProjectCard({
  project,
  statusLabels,
  contributorsLabel,
}: {
  project: ProjectCardData;
  statusLabels?: Partial<Record<ProjectStatus, string>>;
  contributorsLabel: string; // localized, e.g. "5 contributors"
}) {
  return (
    <Link href={`/projects/${project._id}`} className="block focus-visible:outline-2 focus-visible:outline-action">
      <Card interactive flush className="h-full">
        <Cover src={project.cover} seed={project.title} />
        <div className="flex flex-col gap-2 p-4">
          <h3 className="line-clamp-1 font-semibold text-ink">{project.title}</h3>
          <StatusBar status={project.status} size="sm" labels={statusLabels} />
          {project.description ? (
            <p className="line-clamp-2 text-sm text-muted">{project.description}</p>
          ) : null}
          <p className="mt-auto flex items-center justify-between text-xs text-muted">
            <span>{contributorsLabel}</span>
            <span>{project.createdAgo}</span>
          </p>
        </div>
      </Card>
    </Link>
  );
}

export interface DashboardCardData {
  domain: string;
  title?: string | null;
  description?: string | null;
  cover?: string | null; // pick from covers[] in the page
  projectsCount: number;
  createdAgo: string;
  live?: boolean;
}

export function DashboardCard({
  dashboard,
  projectsLabel,
}: {
  dashboard: DashboardCardData;
  projectsLabel: string; // localized "N projects"
}) {
  return (
    <Link href={`/dashboards/${dashboard.domain}`} className="block focus-visible:outline-2 focus-visible:outline-action">
      <Card interactive flush className="h-full">
        <Cover src={dashboard.cover} seed={dashboard.domain} />
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="line-clamp-1 font-semibold text-ink">
            {dashboard.title || dashboard.domain}
          </h3>
          <p className="text-xs font-medium tracking-wide text-project">/{dashboard.domain}</p>
          {dashboard.description ? (
            <p className="line-clamp-2 text-sm text-muted">{dashboard.description}</p>
          ) : null}
          <p className="mt-auto flex items-center justify-between text-xs text-muted">
            <span>{projectsLabel}</span>
            <span>{dashboard.createdAgo}</span>
          </p>
        </div>
      </Card>
    </Link>
  );
}

export interface UserCardData {
  _id: string;
  name: string;
  username?: string | null;
  picture?: string | null;
  bio?: string | null;
}

export function UserCard({ user }: { user: UserCardData }) {
  return (
    <Link href={`/users/${user._id}`} className="block focus-visible:outline-2 focus-visible:outline-action">
      <Card interactive className="flex h-full items-start gap-3">
        <DiamondAvatar name={user.name} src={user.picture} entity="user" size="md" />
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-semibold text-ink">{user.name}</h3>
          {user.username ? <p className="text-xs text-muted">@{user.username}</p> : null}
          {user.bio ? <p className="mt-1 line-clamp-2 text-sm text-muted">{user.bio}</p> : null}
        </div>
      </Card>
    </Link>
  );
}

export interface CollectionCardData {
  _id: string;
  title: string;
  description?: string | null;
  createdAgo: string;
}

export function CollectionCard({
  collection,
  dashboardsLabel,
}: {
  collection: CollectionCardData;
  dashboardsLabel: string; // localized "N dashboards"
}) {
  return (
    <Link href={`/collections/${collection._id}`} className="block focus-visible:outline-2 focus-visible:outline-action">
      <Card interactive className="flex h-full items-start gap-3">
        <DiamondAvatar name={collection.title} entity="collection" size="md" />
        <div className="min-w-0">
          <h3 className="line-clamp-1 font-semibold text-ink">{collection.title}</h3>
          {collection.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{collection.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            {dashboardsLabel} · {collection.createdAgo}
          </p>
        </div>
      </Card>
    </Link>
  );
}
