import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PROJECT_STATUSES, type ProjectStatus } from "@hackdash/db/shared";
import { cx } from "@/lib/cx";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import {
  CollectionCard,
  DashboardCard,
  ProjectCard,
  type ProjectCardData,
} from "@/components/entities/cards";
import { DeleteDashboardButton } from "./DeleteDashboardButton";
import type { SerializedProfile } from "./serialize";

// The profile aggregate rendered as identity header + entity-colored tab
// pills with count chips (the sanctioned "count chips on profiles" use of
// entity colors) + one card grid per tab. Server-rendered; tabs sync via
// ?tab=. Shared by the public profile and the own-profile page.

export type ProfileTab =
  | "collections"
  | "dashboards"
  | "projects"
  | "contributions"
  | "following";

export type ProfileViewData = SerializedProfile;

const TAB_COLORS: Record<ProfileTab, string> = {
  collections: "var(--entity-collection)",
  dashboards: "var(--entity-dashboard)",
  projects: "var(--entity-project)",
  // Contributions had its own hue in legacy; highlight is its MP counterpart.
  contributions: "var(--highlight)",
  following: "var(--entity-user)",
};

export async function ProfileView({
  profile,
  activeTab,
  basePath,
  editProfileHref,
  manageDashboards = false,
  toolsSlot,
}: {
  profile: ProfileViewData;
  /** Raw ?tab= value; falls back to the first available tab. */
  activeTab?: string;
  /** Path the tab pills link to (e.g. /users/123 or /users/profile). */
  basePath: string;
  /** Shown when the viewer is looking at their own PUBLIC profile. */
  editProfileHref?: string;
  /** Own profile: adds the guarded delete overlay on dashboard cards. */
  manageDashboards?: boolean;
  /** Own profile: rendered between the header and the tabs. */
  toolsSlot?: ReactNode;
}) {
  const t = await getTranslations();

  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((s) => [s, t(`common.status.${s}`)]),
  ) as Record<ProjectStatus, string>;

  const tabs: { key: ProfileTab; count: number }[] = [
    // Collections appear only when the user curates any (legacy behavior).
    ...(profile.collections.length > 0
      ? [{ key: "collections" as const, count: profile.collections.length }]
      : []),
    { key: "dashboards", count: profile.dashboards.length },
    { key: "projects", count: profile.projects.length },
    { key: "contributions", count: profile.contributions.length },
    { key: "following", count: profile.following.length },
  ];
  const active: ProfileTab = tabs.some((tab) => tab.key === activeTab)
    ? (activeTab as ProfileTab)
    : tabs[0].key;

  const empty = (
    <p className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
      {t("profile.empty")}
    </p>
  );

  const projectGrid = (projects: ProjectCardData[]) =>
    projects.length === 0 ? (
      empty
    ) : (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project._id}>
            <ProjectCard
              project={project}
              statusLabels={statusLabels}
              contributorsLabel={t("common.counts.contributors", {
                count: project.contributorsCount,
              })}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <div>
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
        <DiamondAvatar name={profile.name} src={profile.picture} entity="user" size="lg" />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-balance text-ink sm:text-4xl">
            {profile.name}
          </h1>
          {profile.username ? (
            <p className="mt-0.5 font-medium text-user">@{profile.username}</p>
          ) : null}
          {profile.bio ? (
            <p className="mt-3 max-w-prose font-light text-muted">{profile.bio}</p>
          ) : null}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {profile.joinedAgo ? (
              /* Proposed key profile.joined */
              <span>Joined {profile.joinedAgo}</span>
            ) : null}
            {editProfileHref ? (
              <Link href={editProfileHref} className="font-medium text-ink underline">
                {t("profile.edit.title")}
              </Link>
            ) : null}
          </p>
        </div>
      </header>

      {toolsSlot}

      {/* Proposed key profile.tabsLabel */}
      <nav aria-label="Profile sections" className="mt-8 flex flex-wrap gap-2">
        {tabs.map(({ key, count }) => {
          const color = TAB_COLORS[key];
          const isActive = key === active;
          return (
            <Link
              key={key}
              href={`${basePath}?tab=${key}`}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                !isActive && "border-line text-muted hover:border-muted hover:text-ink",
              )}
              style={
                isActive
                  ? {
                      color: `color-mix(in srgb, ${color} 70%, var(--ink))`,
                      borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                      background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    }
                  : undefined
              }
            >
              {t(`profile.tabs.${key}`)}
              <span
                className="inline-flex min-w-5 justify-center rounded-full px-1.5 py-px text-xs font-semibold tabular-nums"
                style={{
                  background: `color-mix(in srgb, ${color} 14%, transparent)`,
                  color: `color-mix(in srgb, ${color} 70%, var(--ink))`,
                }}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      <section className="mt-6">
        {active === "collections" ? (
          profile.collections.length === 0 ? (
            empty
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.collections.map(({ card, dashboardsCount }) => (
                <li key={card._id}>
                  <CollectionCard
                    collection={card}
                    dashboardsLabel={t("common.counts.dashboards", { count: dashboardsCount })}
                  />
                </li>
              ))}
            </ul>
          )
        ) : null}

        {active === "dashboards" ? (
          profile.dashboards.length === 0 ? (
            empty
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.dashboards.map(({ id, card }) => (
                <li key={id} className="relative">
                  <DashboardCard
                    dashboard={card}
                    projectsLabel={t("common.counts.projects", { count: card.projectsCount })}
                  />
                  {manageDashboards ? <DeleteDashboardButton domain={card.domain} /> : null}
                </li>
              ))}
            </ul>
          )
        ) : null}

        {active === "projects" ? projectGrid(profile.projects) : null}
        {active === "contributions" ? projectGrid(profile.contributions) : null}
        {active === "following" ? projectGrid(profile.following) : null}
      </section>
    </div>
  );
}
