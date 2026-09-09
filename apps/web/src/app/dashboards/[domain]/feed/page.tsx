import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDashboard, ServiceError } from "@hackdash/db";
import { FeedStream } from "@/components/feed/FeedStream";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Live activity feed for a dashboard — the projector surface (legacy item 43,
// restored). Commits to the dark ink ground in both themes: this page is
// meant to be thrown on a wall during the hackathon, so the type is large
// and the palette is the Media Party dark ground.

interface DashboardShape {
  domain?: string | null;
  title?: string | null;
}

async function loadDashboard(domain: string): Promise<DashboardShape> {
  await db();
  try {
    return (await getDashboard(domain)) as DashboardShape;
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const [dashboard, t] = await Promise.all([
    loadDashboard(domain),
    getTranslations("feed"),
  ]);
  return { title: `${dashboard.title?.trim() || domain} — ${t("title")}` };
}

export default async function FeedPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const [dashboard, t] = await Promise.all([
    loadDashboard(domain),
    getTranslations("feed"),
  ]);
  const title = dashboard.title?.trim() || domain;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#071d33]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-8">
          <p className="text-sm font-bold tracking-[0.28em] text-mp-cyan uppercase">
            /{domain}
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold text-[#e9f1f8] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-[#90aac0]">{t("title")}</p>
        </header>
        <FeedStream domain={domain} />
      </div>
    </div>
  );
}
