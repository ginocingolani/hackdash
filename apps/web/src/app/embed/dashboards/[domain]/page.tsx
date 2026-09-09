import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getDashboard,
  listProjects,
  PROJECT_STATUSES,
  ServiceError,
  type ProjectStatus,
} from "@hackdash/db";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/og";
import {
  applyEmbedParams,
  firstParam,
  hideSet,
  serializeProject,
  sliderColumns,
  type EmbedSearchParams,
} from "../../lib";
import { EmbedAttribution, EmbedProjectCard, type ActionBarLabels } from "../../parts";

export const dynamic = "force-dynamic";

// Dashboard iframe embed (legacy parity, docs/legacy/client.md §3 item 40).
// Honors exactly the legacy params:
//   hide=title,desc,logo,pprg,ptitle,pcontrib,pacnbar
//   query= keyword filter · status= exact status · sort=name|date|showcase
//   slider=1..6 → N-column grid (no carousel in the rewrite)
// Hidden elements are not rendered at all.

interface DashboardShape {
  domain?: string | null;
  title?: string | null;
  description?: string | null;
  showcase?: string[];
}

export default async function DashboardEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ domain: string }>;
  searchParams: Promise<EmbedSearchParams>;
}) {
  const [{ domain }, sp] = await Promise.all([params, searchParams]);

  await db();
  let dashboard: DashboardShape;
  let projectDocs: unknown[];
  try {
    [dashboard, projectDocs] = await Promise.all([
      getDashboard(domain) as Promise<DashboardShape>,
      listProjects({ domain }) as Promise<unknown[]>,
    ]);
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) notFound();
    throw error;
  }

  const hide = hideSet(sp);
  const columns = sliderColumns(sp);
  const query = firstParam(sp, "query");

  const projects = applyEmbedParams(
    projectDocs.map(serializeProject),
    dashboard.showcase ?? [],
    sp
  );

  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, t(`common.status.${status}`)])
  ) as Partial<Record<ProjectStatus, string>>;

  const show = {
    progress: !hide.has("pprg"),
    title: !hide.has("ptitle"),
    contributors: !hide.has("pcontrib"),
    actionBar: !hide.has("pacnbar"),
  };
  const showTitle = !hide.has("title");
  const showDesc = !hide.has("desc");
  const showLogo = !hide.has("logo");

  const dashboardUrl = absoluteUrl(`/dashboards/${encodeURIComponent(domain)}`);

  return (
    <div className="mx-auto max-w-6xl">
      {showTitle || showDesc ? (
        <header className="mb-3">
          {showTitle ? (
            <h1 className="text-lg leading-tight font-semibold">
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ink hover:underline"
              >
                {dashboard.title?.trim() || domain}
              </a>
            </h1>
          ) : null}
          {showDesc && dashboard.description ? (
            <p className="mt-1 text-sm text-muted">{dashboard.description}</p>
          ) : null}
        </header>
      ) : null}

      {projects.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {query ? t("dashboard.wall.noResults", { query }) : t("common.state.empty")}
        </p>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: columns
              ? `repeat(${columns}, minmax(0, 1fr))`
              : "repeat(auto-fill, minmax(230px, 1fr))",
          }}
        >
          {projects.map((project) => (
            <EmbedProjectCard
              key={project._id}
              project={project}
              show={show}
              statusLabels={statusLabels}
              actionLabels={actionLabels(t, project)}
              locale={locale}
            />
          ))}
        </div>
      )}

      {showLogo ? <EmbedAttribution /> : null}
    </div>
  );
}

function actionLabels(
  t: Awaited<ReturnType<typeof getTranslations>>,
  project: { contributorsCount: number; followersCount: number }
): ActionBarLabels {
  return {
    join: t("project.card.join"),
    follow: t("project.card.follow"),
    demo: t("project.card.demo"),
    contributors: t("common.counts.contributors", { count: project.contributorsCount }),
    followers: t("common.counts.followers", { count: project.followersCount }),
  };
}
