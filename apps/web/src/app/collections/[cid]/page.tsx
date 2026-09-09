import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ServiceError, getCollection } from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/timeAgo";
import { DiamondAvatar } from "@/components/ui/DiamondAvatar";
import { DashboardCard } from "@/components/entities/cards";
import { CollectionManager } from "@/components/collection/CollectionManager";
import { RemoveFromCollectionButton } from "@/components/collection/RemoveFromCollectionButton";
import { toDashboardEntry, type DashboardDocLike } from "@/components/profile/serialize";

// Collection page — details + grid of dashboard cards (improvement plan
// items 33–35). Owners get the restored write path: inline editing,
// search-and-add, per-card remove, delete.

interface PopulatedCollection {
  _id: unknown;
  title?: string | null;
  description?: string | null;
  created_at?: Date | string;
  owner?: {
    _id: unknown;
    name?: string | null;
    username?: string | null;
  } | null;
  dashboards?: DashboardDocLike[] | null;
}

const loadCollection = cache(async (cid: string): Promise<PopulatedCollection> => {
  await db();
  try {
    const doc = await getCollection(cid);
    return doc.toObject() as unknown as PopulatedCollection;
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) notFound();
    // Malformed ObjectId in the URL — treat as a missing page, not a crash.
    if ((error as { name?: string } | null)?.name === "CastError") notFound();
    throw error;
  }
});

type Props = { params: Promise<{ cid: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cid } = await params;
  const collection = await loadCollection(cid);
  return { title: collection.title?.trim() || "Collection" };
}

export default async function CollectionPage({ params }: Props) {
  const { cid } = await params;
  const [collection, uid, locale, t] = await Promise.all([
    loadCollection(cid),
    currentUserId(),
    getLocale(),
    getTranslations(),
  ]);

  const title = collection.title?.trim() || "Untitled collection";
  const owner = collection.owner ?? null;
  const isOwner = uid !== null && owner !== null && String(owner._id) === uid;
  const dashboards = (collection.dashboards ?? []).map((d) => toDashboardEntry(d, locale));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
        <DiamondAvatar name={title} entity="collection" size="lg" />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-balance text-ink sm:text-4xl">{title}</h1>
          {collection.description ? (
            <p className="mt-2 max-w-prose text-lg font-light text-muted">
              {collection.description}
            </p>
          ) : null}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {owner ? (
              <>
                <span>
                  {/* Proposed key collection.curatedBy */}
                  Curated by{" "}
                  <Link
                    href={`/users/${String(owner._id)}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {owner.name || owner.username || "?"}
                  </Link>
                </span>
                <span aria-hidden="true">·</span>
              </>
            ) : null}
            <span>{t("common.counts.dashboards", { count: dashboards.length })}</span>
            <span aria-hidden="true">·</span>
            <span>{timeAgo(collection.created_at ?? new Date(), locale)}</span>
          </p>
        </div>
      </header>

      {isOwner ? (
        <CollectionManager
          cid={cid}
          title={collection.title ?? ""}
          description={collection.description ?? ""}
          dashboardIds={dashboards.map((d) => d.id)}
        />
      ) : null}

      <section className="mt-8">
        {dashboards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <p className="font-semibold text-ink">{t("collection.empty.title")}</p>
            <p className="mt-1 text-sm text-muted">{t("collection.empty.body")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map(({ id, card }) => (
              <li key={id} className="relative">
                <DashboardCard
                  dashboard={card}
                  projectsLabel={t("common.counts.projects", { count: card.projectsCount })}
                />
                {isOwner ? (
                  <RemoveFromCollectionButton
                    cid={cid}
                    did={id}
                    label={t("collection.removeFromCollection")}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
