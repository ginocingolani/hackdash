import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  PROJECT_STATUSES,
  getProject,
  isDashboardAdmin,
  type ProjectStatus,
} from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { ProjectForm } from "@/components/project/ProjectForm";
import type { StatusLabels } from "@/components/dashboard/types";

// Project edit: the create form prefilled, with the status as a tappable
// segmented control (StatusPicker). Guarded server-side: leader or dashboard
// admin only — everyone else lands back on the project page.

type Params = Promise<{ pid: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("project.form");
  return { title: t("editTitle") };
}

export default async function EditProjectPage({ params }: { params: Params }) {
  const { pid } = await params;
  await db();
  let project: Awaited<ReturnType<typeof getProject>>;
  try {
    project = await getProject(pid);
  } catch {
    notFound();
  }

  const uid = await currentUserId();
  if (!uid) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/projects/${pid}/edit`)}`);
  }

  const leader = project.leader as { _id?: unknown } | null | undefined;
  const isLeader = !!leader?._id && String(leader._id) === uid;
  const isAdmin =
    !isLeader && project.domain ? await isDashboardAdmin(uid, project.domain) : false;
  if (!isLeader && !isAdmin) redirect(`/projects/${pid}`);

  const [t, tCommon] = await Promise.all([
    getTranslations("project.form"),
    getTranslations("common"),
  ]);

  const statusLabels = Object.fromEntries(
    PROJECT_STATUSES.map((status) => [status, tCommon(`status.${status}`)]),
  ) as StatusLabels;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/projects/${pid}`}
        className="text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        ← {project.title}
      </Link>
      <h1 className="mt-2 mb-8 text-3xl font-bold text-ink">{t("editTitle")}</h1>
      <ProjectForm
        mode="edit"
        pid={pid}
        statusLabels={statusLabels}
        initial={{
          title: project.title,
          description: project.description,
          link: project.link ?? "",
          status: project.status as ProjectStatus,
          tags: (project.tags ?? []).map(String),
          cover: project.cover ?? null,
        }}
      />
    </section>
  );
}
