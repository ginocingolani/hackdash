"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Input";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { ProjectCard } from "@/components/entities/cards";
import { AdminPanel } from "./AdminPanel";
import { ShareDialog } from "./ShareDialog";
import { ShowcaseEditor } from "./ShowcaseEditor";
import type { StatusLabels, WallAdmin, WallDashboard, WallProject, WallSort } from "./types";

// The dashboard wall: sticky compact identity bar (admin diamond cluster —
// the Media Party overlap motif — title, search, sort, actions) over a
// uniform project grid. Filtering and sorting are client-side over the
// full loaded list, synced to ?q= and ?sort= without a server round-trip.

interface WallProps {
  dashboard: WallDashboard;
  projects: WallProject[];
  admins: WallAdmin[];
  statusCounts: Record<string, number>;
  statusLabels: StatusLabels;
  isAdmin: boolean;
  isLoggedIn: boolean;
  initialQuery: string;
  initialSort: WallSort;
}

export function Wall({
  dashboard: initialDashboard,
  projects,
  admins: initialAdmins,
  statusCounts,
  statusLabels,
  isAdmin,
  isLoggedIn,
  initialQuery,
  initialSort,
}: WallProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common.actions");

  const [dashboard, setDashboard] = useState(initialDashboard);
  const [admins, setAdmins] = useState(initialAdmins);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<WallSort>(initialSort);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showcaseMode, setShowcaseMode] = useState(false);

  // Keep ?q= and ?sort= shareable without refetching the page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query) params.set("q", query);
    else params.delete("q");
    if (sort !== "date") params.set("sort", sort);
    else params.delete("sort");
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [query, sort]);

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    if (sort === "name") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sort === "showcase" && dashboard.showcase.length > 0) {
      const position = new Map(dashboard.showcase.map((id, i) => [id, i]));
      return list
        .filter((p) => position.has(p._id))
        .sort((a, b) => (position.get(a._id) ?? 0) - (position.get(b._id) ?? 0));
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [projects, query, sort, dashboard.showcase]);

  const createHref = `/dashboards/${dashboard.domain}/create`;
  const newProjectHref = isLoggedIn
    ? createHref
    : `/api/auth/signin?callbackUrl=${encodeURIComponent(createHref)}`;

  return (
    <>
      {/* Sticky compact sub-header */}
      <div className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {admins.length > 0 ? (
              <span className="flex shrink-0" role="group" aria-label={t("admin.tools")}>
                {admins.slice(0, 4).map((admin, i) => (
                  <DiamondAvatar
                    key={admin._id}
                    name={admin.name}
                    src={admin.picture}
                    entity="user"
                    size="sm"
                    className={i > 0 ? "-ml-4" : undefined}
                  />
                ))}
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="truncate text-base leading-tight font-semibold text-ink">
                {dashboard.title || dashboard.domain}
                {dashboard.link ? (
                  <a
                    href={dashboard.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("wall.openWebsite")}
                    className="ml-2 inline-flex align-middle text-muted transition-colors hover:text-action"
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
                      <path
                        d="M6.5 3.5H3.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5M9.5 2.5h4m0 0v4m0-4L7 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ) : null}
              </h1>
              {dashboard.description ? (
                <p className="truncate text-xs text-muted">{dashboard.description}</p>
              ) : null}
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SearchInput
              label={t("wall.searchPlaceholder")}
              placeholder={t("wall.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-44 sm:w-56"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as WallSort)}
              aria-label={t("wall.sort.label")}
              className="h-10 rounded-lg border border-line bg-raised px-2.5 text-sm text-ink transition-colors hover:border-muted/60"
            >
              <option value="name">{t("wall.sort.byName")}</option>
              <option value="date">{t("wall.sort.byDate")}</option>
              <option value="showcase">{t("wall.sort.byShowcase")}</option>
            </select>
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              {tc("share")}
            </Button>
            {dashboard.open ? (
              <Button href={newProjectHref}>+ {t("wall.createProject")}</Button>
            ) : null}
          </div>
        </div>

        {/* Slim admin toolbar */}
        {isAdmin ? (
          <div className="border-t border-line/60">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-1.5">
              <Button variant="ghost" size="sm" onClick={() => setAdminPanelOpen(true)}>
                {t("admin.tools")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowcaseMode((mode) => !mode)}
                aria-pressed={showcaseMode}
              >
                {t("showcase.edit")}
              </Button>
              <a
                href={`/api/v2/dashboards/${dashboard.domain}/csv`}
                className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-line/50"
              >
                {t("csv.export")}
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <section className="mx-auto max-w-6xl px-4 py-6">
        {!dashboard.open ? (
          <p className="mb-5 rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-ink">
            {t("wall.closedNotice")}
          </p>
        ) : null}

        {showcaseMode && isAdmin ? (
          <ShowcaseEditor
            domain={dashboard.domain}
            projects={projects}
            showcase={dashboard.showcase}
            onSaved={(showcase) => {
              setDashboard((d) => ({ ...d, showcase }));
              setShowcaseMode(false);
            }}
            onCancel={() => setShowcaseMode(false)}
          />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <h2 className="text-xl font-semibold text-ink">{t("wall.empty.title")}</h2>
            <p className="text-sm text-muted">{t("wall.empty.body")}</p>
            {dashboard.open ? (
              <Button href={newProjectHref} className="mt-2">
                {t("wall.empty.cta")}
              </Button>
            ) : null}
          </div>
        ) : visibleProjects.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted">
            {t("wall.noResults", { query })}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProjects.map((project) => (
              <li key={project._id}>
                <ProjectCard
                  project={project}
                  statusLabels={statusLabels}
                  contributorsLabel={project.contributorsLabel}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        domain={dashboard.domain}
        title={dashboard.title || dashboard.domain}
        statusCounts={statusCounts}
        statusLabels={statusLabels}
      />

      {isAdmin ? (
        <AdminPanel
          open={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
          dashboard={dashboard}
          admins={admins}
          onDashboardChange={(patch) => setDashboard((d) => ({ ...d, ...patch }))}
          onAdminsChange={setAdmins}
        />
      ) : null}
    </>
  );
}
