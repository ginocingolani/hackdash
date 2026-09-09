import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getProject,
  PROJECT_STATUSES,
  ServiceError,
  type ProjectStatus,
} from "@hackdash/db";
import { StatusBar } from "@/components/ui/StatusBar";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/og";
import { hideSet, serializeProject, type EmbedSearchParams } from "../../lib";
import {
  ContributorRow,
  EmbedActionBar,
  EmbedAttribution,
  EmbedCover,
} from "../../parts";

export const dynamic = "force-dynamic";

// Project iframe embed (legacy parity, docs/legacy/client.md §3 item 41).
// Honors exactly the legacy hide tokens: prg,pic,title,desc,contrib,acnbar.
// Hidden elements are not rendered at all.

export default async function ProjectEmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ pid: string }>;
  searchParams: Promise<EmbedSearchParams>;
}) {
  const [{ pid }, sp] = await Promise.all([params, searchParams]);

  await db();
  let doc: unknown;
  try {
    doc = await getProject(pid);
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) notFound();
    throw error;
  }
  const project = serializeProject(doc);

  const hide = hideSet(sp);
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, t(`common.status.${status}`)])
  ) as Partial<Record<ProjectStatus, string>>;

  const projectUrl = absoluteUrl(`/projects/${project._id}`);

  return (
    <div className="mx-auto max-w-xl">
      <article className="overflow-hidden rounded-2xl border border-line bg-raised">
        {!hide.has("prg") ? (
          <div className="px-4 pt-4">
            <StatusBar status={project.status} size="md" labels={statusLabels} />
          </div>
        ) : null}

        {!hide.has("pic") ? (
          <div className="mt-3">
            <EmbedCover src={project.cover} seed={project.title} className="h-36" />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 p-4">
          {!hide.has("title") ? (
            <header>
              <h1 className="text-lg leading-snug font-semibold">
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink hover:underline"
                >
                  {project.title}
                </a>
              </h1>
              {project.domain ? (
                <a
                  href={absoluteUrl(`/dashboards/${encodeURIComponent(project.domain)}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium tracking-wide text-project hover:underline"
                >
                  /{project.domain}
                </a>
              ) : null}
            </header>
          ) : null}

          {!hide.has("desc") && project.description ? (
            <div className="space-y-2 text-sm text-muted [&_a]:text-project [&_a]:underline [&_code]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc">
              <Markdown remarkPlugins={[remarkGfm]}>{project.description}</Markdown>
            </div>
          ) : null}

          {!hide.has("contrib") ? <ContributorRow project={project} /> : null}

          {!hide.has("acnbar") ? (
            <EmbedActionBar
              project={project}
              labels={{
                join: t("project.card.join"),
                follow: t("project.card.follow"),
                demo: t("project.card.demo"),
                contributors: t("common.counts.contributors", {
                  count: project.contributorsCount,
                }),
                followers: t("common.counts.followers", {
                  count: project.followersCount,
                }),
              }}
              locale={locale}
            />
          ) : null}
        </div>
      </article>

      {!hide.has("logo") ? <EmbedAttribution /> : null}
    </div>
  );
}
