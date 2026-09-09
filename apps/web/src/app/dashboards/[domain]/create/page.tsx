import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PROJECT_STATUSES, getDashboard } from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/project/ProjectForm";
import type { StatusLabels } from "@/components/dashboard/types";

// Project create (screen 4): modal-free single page — two required fields
// plus optional GitHub import. Speed is the feature.

type Params = Promise<{ domain: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("project.form");
  return { title: t("createTitle") };
}

export default async function CreateProjectPage({ params }: { params: Params }) {
  const { domain } = await params;
  await db();
  let dashboard: Awaited<ReturnType<typeof getDashboard>>;
  try {
    dashboard = await getDashboard(domain);
  } catch {
    notFound();
  }

  const uid = await currentUserId();
  if (!uid) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(`/dashboards/${domain}/create`)}`,
    );
  }

  const [t, tDashboard, tCommon] = await Promise.all([
    getTranslations("project.form"),
    getTranslations("dashboard.wall"),
    getTranslations("common"),
  ]);

  if (!dashboard.open) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">{t("createTitle")}</h1>
        <p className="mt-4 rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-ink">
          {tDashboard("closedNotice")}
        </p>
        <Button href={`/dashboards/${domain}`} variant="secondary" className="mt-6">
          {tCommon("actions.back")}
        </Button>
      </section>
    );
  }

  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, tCommon(`status.${status}`)]),
  ) as StatusLabels;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/dashboards/${domain}`}
        className="text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        ← /{domain}
      </Link>
      <h1 className="mt-2 mb-8 text-3xl font-bold text-ink">{t("createTitle")}</h1>
      <ProjectForm mode="create" domain={domain} statusLabels={statusLabels} />
    </section>
  );
}
