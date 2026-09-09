import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  PROJECT_STATUSES,
  getProject,
  isDashboardAdmin,
  type ProjectStatus,
} from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { StatusBar } from "@/components/ui/StatusBar";
import { Button } from "@/components/ui/Button";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { coverGradient } from "@/components/entities/coverFallback";
import { Markdown } from "@/components/project/Markdown";
import { MembershipActions } from "@/components/project/MembershipActions";
import type { StatusLabels } from "@/components/dashboard/types";

// Project detail (screen 3): cover banner with title + status bar on an ink
// scrim; markdown description left, team/links/tags rail right. The primary
// action swaps by the viewer's relationship to the project.

const loadProject = cache(async (pid: string) => {
  await db();
  try {
    return await getProject(pid);
  } catch {
    return null;
  }
});

type Params = Promise<{ pid: string }>;

interface TeamUser {
  _id: string;
  name: string;
  username: string | null;
  picture: string | null;
}

function serializeUser(user: unknown): TeamUser | null {
  if (!user || typeof user !== "object" || !("_id" in user)) return null;
  const u = user as { _id: unknown; name?: string; username?: string; picture?: string };
  return {
    _id: String(u._id),
    name: u.name ?? "?",
    username: u.username ?? null,
    picture: u.picture ?? null,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pid } = await params;
  const project = await loadProject(pid);
  return { title: project?.title ?? "HackDash" };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { pid } = await params;
  const project = await loadProject(pid);
  if (!project) notFound();

  const uid = await currentUserId();
  const domain = project.domain ?? null;
  const [isAdmin, tCommon, t] = await Promise.all([
    uid && domain ? isDashboardAdmin(uid, domain) : Promise.resolve(false),
    getTranslations("common"),
    getTranslations("project"),
  ]);

  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, tCommon(`status.${status}`)]),
  ) as StatusLabels;

  const leader = serializeUser(project.leader);
  const contributors = (project.contributors ?? [])
    .map(serializeUser)
    .filter((u): u is TeamUser => !!u);
  const followers = (project.followers ?? [])
    .map(serializeUser)
    .filter((u): u is TeamUser => !!u);

  const isLeader = !!uid && !!leader && leader._id === uid;
  const isContributor = !!uid && contributors.some((u) => u._id === uid);
  const isFollower = !!uid && followers.some((u) => u._id === uid);
  const canEdit = isLeader || isAdmin;
  const status = project.status as ProjectStatus;
  const tags = (project.tags ?? []).map(String);

  return (
    <article>
      {/* Cover banner with ink scrim */}
      <header
        className="relative flex min-h-64 items-end sm:min-h-80"
        style={project.cover ? undefined : { background: coverGradient(project.title) }}
      >
        {project.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary legacy hosts
          <img
            src={project.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-mp-ink/90 via-mp-ink/40 to-transparent"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-6">
          {domain ? (
            <Link
              href={`/dashboards/${domain}`}
              className="text-sm font-medium text-mp-white/80 transition-colors hover:text-mp-white"
            >
              {t("detail.hackingAt", { dashboard: `/${domain}` })}
            </Link>
          ) : null}
          <h1 className="mt-1 max-w-3xl text-3xl font-bold text-balance text-mp-white sm:text-4xl">
            {project.title}
          </h1>
          <StatusBar
            status={status}
            size="md"
            labels={statusLabels}
            className="mt-4 max-w-sm [&_.bg-line]:bg-mp-white/30 [&_p]:text-mp-white [&_p_span]:text-mp-white/70"
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Description */}
        <Markdown>{project.description}</Markdown>

        {/* Rail */}
        <aside className="flex flex-col gap-7 lg:order-last">
          <MembershipActions
            pid={pid}
            domain={domain}
            isLoggedIn={!!uid}
            isLeader={isLeader}
            canEdit={canEdit}
            initialContributor={isContributor}
            initialFollower={isFollower}
          />

          {project.link ? (
            <Button
              href={project.link}
              variant="secondary"
              className="w-full"
              target="_blank"
              rel="noreferrer"
            >
              {t("card.demo")}
            </Button>
          ) : null}

          {leader ? (
            <section>
              <h2 className="text-sm font-medium text-muted">{t("detail.managedBy")}</h2>
              <Link
                href={`/users/${leader._id}`}
                className="mt-2 flex items-center gap-2.5"
              >
                <DiamondAvatar name={leader.name} src={leader.picture} entity="user" size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {leader.name}
                  </span>
                  {leader.username ? (
                    <span className="block truncate text-xs text-muted">@{leader.username}</span>
                  ) : null}
                </span>
              </Link>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-medium text-muted">
              {t("detail.contributors")} ·{" "}
              {tCommon("counts.contributors", { count: contributors.length })}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {contributors.map((user) => (
                <li key={user._id}>
                  <Link href={`/users/${user._id}`} title={user.name}>
                    <DiamondAvatar name={user.name} src={user.picture} entity="user" size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted">
              {t("detail.followers")} ·{" "}
              {tCommon("counts.followers", { count: followers.length })}
            </h2>
            {followers.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {followers.map((user) => (
                  <li key={user._id}>
                    <Link href={`/users/${user._id}`} title={user.name}>
                      <DiamondAvatar
                        name={user.name}
                        src={user.picture}
                        entity="user"
                        size="sm"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {tags.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium text-muted">{t("form.tagsLabel")}</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/projects?q=${encodeURIComponent(tag)}`}
                      className="inline-flex rounded-full border border-line bg-raised px-2.5 py-0.5 text-xs font-medium text-ink transition-colors hover:border-muted/60"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
