import type { ProjectStatus } from "@hackdash/db";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { StatusBar } from "@/components/ui/StatusBar";
import { DiamondMark, Wordmark } from "@/components/Wordmark";
import { coverGradient } from "@/components/entities/coverFallback";
import { absoluteUrl } from "@/lib/og";
import { timeAgo } from "@/lib/timeAgo";
import type { EmbedProject } from "./lib";

// Lean embed-specific building blocks. Embeds render inside third-party
// iframes: everything stays quiet and compact, every link opens the main
// site in a new tab (target="_blank"), and hidden elements are simply not
// rendered (never hidden with CSS/DOM removal).

export function EmbedCover({
  src,
  seed,
  className = "h-24",
}: {
  src: string | null;
  seed: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={src ? undefined : { background: coverGradient(seed) }}
    >
      {src ? (
        // Arbitrary remote hosts (legacy data) — plain img by design.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

/** Up to five contributor diamonds, matching the legacy embed card. */
export function ContributorRow({ project }: { project: EmbedProject }) {
  return (
    <ul className="flex items-center gap-0.5">
      {project.contributors.slice(0, 5).map((user) => (
        <li key={user._id}>
          <a
            href={absoluteUrl(`/users/${user._id}`)}
            target="_blank"
            rel="noreferrer"
            title={user.name}
            className="block rounded-md"
          >
            <DiamondAvatar name={user.name} src={user.picture} entity="user" size="sm" />
          </a>
        </li>
      ))}
      {project.contributorsCount > 5 ? (
        <li className="pl-1 text-xs text-muted">+{project.contributorsCount - 5}</li>
      ) : null}
    </ul>
  );
}

export interface ActionBarLabels {
  join: string;
  follow: string;
  demo: string;
  contributors: string; // localized "N contributors"
  followers: string; // localized "N followers"
}

/** Time-ago plus Join / Follow / Demo links — the legacy embed action bar. */
export function EmbedActionBar({
  project,
  labels,
  locale,
}: {
  project: EmbedProject;
  labels: ActionBarLabels;
  locale: string;
}) {
  const projectUrl = absoluteUrl(`/projects/${project._id}`);
  return (
    <div className="flex items-center gap-3 border-t border-line pt-2 text-xs">
      <time dateTime={project.createdAt} className="text-muted">
        {timeAgo(project.createdAt, locale)}
      </time>
      <span className="ml-auto flex items-center gap-3">
        <a
          href={projectUrl}
          target="_blank"
          rel="noreferrer"
          title={labels.contributors}
          className="font-medium text-action hover:underline"
        >
          {labels.join}
        </a>
        <a
          href={projectUrl}
          target="_blank"
          rel="noreferrer"
          title={labels.followers}
          className="font-medium text-action hover:underline"
        >
          {labels.follow}
        </a>
        {project.link ? (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-project hover:underline"
          >
            {labels.demo}
          </a>
        ) : null}
      </span>
    </div>
  );
}

export interface DashboardEmbedCardShow {
  progress: boolean; // hide token: pprg
  title: boolean; // hide token: ptitle
  contributors: boolean; // hide token: pcontrib
  actionBar: boolean; // hide token: pacnbar
}

/** Compact project card for the dashboard embed grid (legacy item 40). */
export function EmbedProjectCard({
  project,
  show,
  statusLabels,
  actionLabels,
  locale,
}: {
  project: EmbedProject;
  show: DashboardEmbedCardShow;
  statusLabels: Partial<Record<ProjectStatus, string>>;
  actionLabels: ActionBarLabels;
  locale: string;
}) {
  const projectUrl = absoluteUrl(`/projects/${project._id}`);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-raised">
      <EmbedCover src={project.cover} seed={project.title} />
      <div className="flex flex-1 flex-col gap-2 p-3">
        {show.progress ? (
          <StatusBar status={project.status} size="sm" labels={statusLabels} />
        ) : null}
        {show.title ? (
          <h3 className="min-w-0 text-sm leading-snug font-semibold">
            <a
              href={projectUrl}
              target="_blank"
              rel="noreferrer"
              className="text-ink hover:underline"
            >
              {project.title}
            </a>
          </h3>
        ) : null}
        {show.contributors ? <ContributorRow project={project} /> : null}
        {show.actionBar ? (
          <div className="mt-auto pt-1">
            <EmbedActionBar project={project} labels={actionLabels} locale={locale} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Small "HackDash" attribution linking back to the main site. */
export function EmbedAttribution() {
  return (
    <a
      href={absoluteUrl("/")}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex items-center gap-1.5 rounded-md opacity-70 transition-opacity hover:opacity-100"
    >
      <DiamondMark size={14} />
      <Wordmark className="text-[10px]" />
    </a>
  );
}
