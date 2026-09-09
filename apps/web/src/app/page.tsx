import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { DASHBOARD_DOMAIN_REGEX, PROJECT_STATUSES } from "@hackdash/db";
import { auth } from "@/auth";
import { Button } from "@/components/ui/Button";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { DashboardCard } from "@/components/entities/cards";
import { CardGrid } from "@/components/discovery/CardGrid";
import { CreateDashboardForm } from "@/components/discovery/CreateDashboardForm";
import { FilterPills } from "@/components/discovery/FilterPills";
import { HeroStatusMotif } from "@/components/discovery/HeroStatusMotif";
import {
  fetchDashboardCards,
  fetchSiteCounts,
  fetchTeam,
} from "@/components/discovery/data";

// The landing (improvement plan §3.3 screen 1): a theme-invariant ink hero —
// the 30-second create-a-dashboard flow plus the status-bar motif — then
// discovery, counters, features, team and the about story on the normal
// ground. No carousels (§2.2 item 5).

const LANDING_GRID_SIZE = 8;

const FEATURES = [
  { key: "progress", color: "bg-mp-red" },
  { key: "upload", color: "bg-mp-blue" },
  { key: "collaborators", color: "bg-mp-orange" },
  { key: "share", color: "bg-mp-teal" },
] as const;

function AboutLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-ink underline decoration-muted/50 underline-offset-4 transition-colors hover:decoration-action"
    >
      {children}
    </a>
  );
}

export default async function Home() {
  const [t, tCommon, locale, session] = await Promise.all([
    getTranslations("landing"),
    getTranslations("common"),
    getLocale(),
    auth(),
  ]);
  const [dashboards, counts, team] = await Promise.all([
    fetchDashboardCards({ limit: LANDING_GRID_SIZE }, locale),
    fetchSiteCounts(),
    fetchTeam(),
  ]);

  const tabLabels = {
    dashboards: t("tabs.dashboards"),
    projects: t("tabs.projects"),
    people: t("tabs.people"),
    collections: t("tabs.collections"),
  };
  const statusLabels = PROJECT_STATUSES.map((s) => tCommon(`status.${s}`));
  const countItems = [
    t("counts.dashboards", { count: counts.dashboards }),
    t("counts.projects", { count: counts.projects }),
    t("counts.users", { count: counts.users }),
    t("counts.collections", { count: counts.collections }),
    t("counts.releasedProjects", { count: counts.releases }),
  ];

  return (
    <>
      {/* Hero — the brand moment: ink ground in both themes. */}
      <section id="create" className="bg-mp-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-mp-white">
            <span className="block text-2xl font-light text-mp-white/85 sm:text-3xl">
              {t("hero.titleTop")}
            </span>
            <span className="mt-2 block text-4xl font-extrabold tracking-[0.18em] uppercase sm:text-6xl">
              {t("hero.titleBottom")}
            </span>
          </h1>
          <div className="mt-10">
            <HeroStatusMotif labels={statusLabels} />
          </div>
          <div className="mt-10">
            <CreateDashboardForm
              authenticated={!!session?.user}
              domainPattern={DASHBOARD_DOMAIN_REGEX.source}
            />
          </div>
        </div>
      </section>

      {/* Discovery — pills + the card grid, opening with dashboards. */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-ink">{t("sections.recent")}</h2>
          <FilterPills active="dashboards" labels={tabLabels} />
        </div>
        {dashboards.length === 0 ? (
          <p className="mt-12 text-center text-muted">{tCommon("state.empty")}</p>
        ) : (
          <CardGrid className="mt-6">
            {dashboards.map((d) => (
              <DashboardCard
                key={d.domain}
                dashboard={d}
                projectsLabel={tCommon("counts.projects", { count: d.projectsCount })}
              />
            ))}
          </CardGrid>
        )}
        <div className="mt-8 flex justify-center">
          <Button href="/dashboards" variant="secondary">
            {tCommon("actions.loadMore")}
          </Button>
        </div>
      </section>

      {/* Stat counters — one quiet line, not a billboard. */}
      <section className="border-y border-line">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-5 text-sm text-muted">
          {countItems.map((item, i) => (
            <Fragment key={item}>
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rotate-45 rounded-[22%] bg-line"
                />
              ) : null}
              <span>{item}</span>
            </Fragment>
          ))}
        </p>
      </section>

      {/* Features strip. */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ key, color }) => (
            <li key={key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 rounded-[22%] ${color}`}
              />
              <p className="text-sm text-ink">{t(`features.${key}`)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Team strip — renders nothing when TEAM_USER_IDS is unset. */}
      {team.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="text-2xl font-bold text-ink">{t("team")}</h2>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-6">
            {team.map((member) => (
              <li key={member._id}>
                <Link
                  href={`/users/${member._id}`}
                  className="flex flex-col items-center gap-1.5 rounded-md"
                >
                  <DiamondAvatar
                    name={member.name}
                    src={member.picture}
                    entity="user"
                    size="md"
                  />
                  <span className="text-sm font-medium text-ink">{member.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* About — the origin story, with its links intact. */}
      <section className="mx-auto max-w-3xl px-4 pb-6">
        <h2 className="text-2xl font-bold text-ink">{t("about.title")}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {t.rich("about.body", {
            mediaParty: (chunks) => <AboutLink href="https://mediaparty.info/">{chunks}</AboutLink>,
            hhba: (chunks) => (
              <AboutLink href="https://twitter.com/HacksHackersBA">{chunks}</AboutLink>
            ),
            blejman: (chunks) => <AboutLink href="https://twitter.com/blejman">{chunks}</AboutLink>,
            dzajdband: (chunks) => (
              <AboutLink href="https://twitter.com/dzajdband">{chunks}</AboutLink>
            ),
          })}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {t.rich("about.cta", {
            cta: (chunks) => (
              <a
                href="#create"
                className="font-semibold text-action underline decoration-action/40 underline-offset-4 transition-colors hover:decoration-action"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </section>
    </>
  );
}
