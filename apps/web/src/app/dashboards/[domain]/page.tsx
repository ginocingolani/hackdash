import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  PROJECT_STATUSES,
  getDashboard,
  getStatusCounts,
  isDashboardAdmin,
  listAdmins,
  listProjects,
  type ProjectStatus,
} from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/timeAgo";
import { Wall } from "@/components/dashboard/Wall";
import { parseWallSort } from "@/components/dashboard/types";
import type { StatusLabels, WallAdmin, WallProject } from "@/components/dashboard/types";

// The dashboard wall (screen 2): sticky identity bar + uniform project grid.
// Data comes straight from the @hackdash/db services; everything crossing
// into the client Wall component is serialized to plain shapes.

const loadDashboard = cache(async (domain: string) => {
  await db();
  try {
    return await getDashboard(domain);
  } catch {
    return null;
  }
});

type Params = Promise<{ domain: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { domain } = await params;
  const dashboard = await loadDashboard(domain);
  return { title: dashboard?.title || domain };
}

export default async function DashboardWallPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ domain }, search] = await Promise.all([params, searchParams]);
  const dashboard = await loadDashboard(domain);
  if (!dashboard) notFound();

  const uid = await currentUserId();
  const [projects, adminUsers, statusCounts, isAdmin, locale, tCommon] = await Promise.all([
    listProjects({ domain }),
    listAdmins(domain),
    getStatusCounts(domain),
    uid ? isDashboardAdmin(uid, domain) : Promise.resolve(false),
    getLocale(),
    getTranslations("common"),
  ]);

  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, tCommon(`status.${status}`)]),
  ) as StatusLabels;

  const wallProjects: WallProject[] = projects.map((project) => {
    const createdAt = project.created_at ? new Date(project.created_at) : new Date();
    const contributorsCount = project.contributors?.length ?? 0;
    return {
      _id: String(project._id),
      title: project.title,
      description: project.description ?? "",
      status: project.status as ProjectStatus,
      cover: project.cover ?? null,
      tags: (project.tags ?? []).map(String),
      contributorsCount,
      contributorsLabel: tCommon("counts.contributors", { count: contributorsCount }),
      createdAgo: timeAgo(createdAt, locale),
      createdAt: createdAt.toISOString(),
    };
  });

  const admins: WallAdmin[] = adminUsers.map((user) => ({
    _id: String(user._id),
    name: user.name,
    username: user.username ?? null,
    picture: user.picture ?? null,
  }));

  const owner = dashboard.owner as { _id?: unknown } | null | undefined;
  const isOwner = !!uid && !!owner?._id && String(owner._id) === uid;

  const q = typeof search.q === "string" ? search.q : "";
  const sort = parseWallSort(typeof search.sort === "string" ? search.sort : undefined);

  return (
    <Wall
      dashboard={{
        domain: dashboard.domain ?? domain,
        title: dashboard.title ?? null,
        description: dashboard.description ?? null,
        link: dashboard.link ?? null,
        open: dashboard.open ?? true,
        showcase: (dashboard.showcase ?? []).map(String),
        isOwner,
      }}
      projects={wallProjects}
      admins={admins}
      statusCounts={statusCounts}
      statusLabels={statusLabels}
      isAdmin={isAdmin}
      isLoggedIn={!!uid}
      initialQuery={q}
      initialSort={sort}
    />
  );
}
