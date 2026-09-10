import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { PROJECT_STATUSES, type ProjectStatus } from "@hackdash/db/shared";
import { Button } from "@/components/ui/Button";
import {
  CollectionCard,
  DashboardCard,
  ProjectCard,
  UserCard,
} from "@/components/entities/cards";
import { CardGrid } from "./CardGrid";
import { FilterPills, DISCOVERY_TABS, type DiscoveryKind } from "./FilterPills";
import { SearchForm } from "./SearchForm";
import {
  fetchCollectionCards,
  fetchDashboardCards,
  fetchProjectCards,
  fetchUserCards,
  LIMIT_MAX,
  PAGE_SIZE,
  type DiscoveryParams,
} from "./data";

// The shared body of the four discovery pages (/dashboards, /projects,
// /users, /collections): heading, filter pills, URL-synced search, the card
// grid, and a ?limit-growing "load more". Fully server-rendered so filtered
// and searched views are shareable URLs (§2.2).

export async function DiscoveryView({ kind, q, limit }: DiscoveryParams & { kind: DiscoveryKind }) {
  const [locale, t, tCommon] = await Promise.all([
    getLocale(),
    getTranslations("landing"),
    getTranslations("common"),
  ]);

  let cards: ReactNode[] = [];
  if (kind === "dashboards") {
    const dashboards = await fetchDashboardCards({ q, limit }, locale);
    cards = dashboards.map((d) => (
      <DashboardCard
        key={d.domain}
        dashboard={d}
        projectsLabel={tCommon("counts.projects", { count: d.projectsCount })}
      />
    ));
  } else if (kind === "projects") {
    const statusLabels = Object.fromEntries(
      PROJECT_STATUSES.map((s) => [s, tCommon(`status.${s}`)]),
    ) as Record<ProjectStatus, string>;
    const projects = await fetchProjectCards({ q, limit }, locale);
    cards = projects.map((p) => (
      <ProjectCard
        key={p._id}
        project={p}
        statusLabels={statusLabels}
        contributorsLabel={tCommon("counts.contributors", { count: p.contributorsCount })}
      />
    ));
  } else if (kind === "people") {
    const users = await fetchUserCards({ q, limit });
    cards = users.map((u) => <UserCard key={u._id} user={u} />);
  } else {
    const collections = await fetchCollectionCards({ q, limit }, locale);
    cards = collections.map((c) => (
      <CollectionCard
        key={c._id}
        collection={c}
        dashboardsLabel={tCommon("counts.dashboards", { count: c.dashboardsCount })}
      />
    ));
  }

  const tabLabels = {
    dashboards: t("tabs.dashboards"),
    projects: t("tabs.projects"),
    people: t("tabs.people"),
    collections: t("tabs.collections"),
  };

  // A full page means there may be more; grow ?limit until the cap.
  const canLoadMore = cards.length === limit && limit < LIMIT_MAX;
  const moreParams = new URLSearchParams();
  if (q) moreParams.set("q", q);
  moreParams.set("limit", String(Math.min(limit + PAGE_SIZE, LIMIT_MAX)));
  const basePath = DISCOVERY_TABS.find((tab) => tab.kind === kind)?.href ?? "/";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ink">{tabLabels[kind]}</h1>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills active={kind} labels={tabLabels} />
        <SearchForm
          initialQuery={q}
          placeholder={t("search.placeholder")}
          label={tCommon("actions.search")}
          className="w-full sm:w-64"
        />
      </div>

      {q && cards.length > 0 ? (
        <p className="mt-6 text-sm text-muted">
          {t("search.results", { count: cards.length, query: q })}
        </p>
      ) : null}

      {cards.length === 0 ? (
        <p className="mt-16 text-center text-muted">
          {q ? t("search.noResults", { query: q }) : tCommon("state.empty")}
        </p>
      ) : (
        <CardGrid className="mt-4">{cards}</CardGrid>
      )}

      {canLoadMore ? (
        <div className="mt-8 flex justify-center">
          <Button href={`${basePath}?${moreParams.toString()}`} variant="secondary">
            {tCommon("actions.loadMore")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
