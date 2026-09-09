import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ServiceError, getProfile } from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { ProfileView } from "@/components/profile/ProfileView";
import { serializeProfile, type ProfileAggregate } from "@/components/profile/serialize";

// Public profile (improvement plan items 36–38): identity header + tabbed
// counts over the legacy aggregate. Email is never rendered here — the
// service only includes it for the user themself, and even then it belongs
// to /users/profile.

const loadProfile = cache(
  async (uid: string): Promise<{ profile: ProfileAggregate; actor: string | null }> => {
    await db();
    const actor = await currentUserId();
    try {
      const profile = (await getProfile(uid, actor ?? undefined)) as unknown as ProfileAggregate;
      return { profile, actor };
    } catch (error) {
      if (error instanceof ServiceError && error.status === 404) notFound();
      // Malformed ObjectId in the URL — a missing page, not a crash.
      if ((error as { name?: string } | null)?.name === "CastError") notFound();
      throw error;
    }
  },
);

type Props = {
  params: Promise<{ uid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const { profile } = await loadProfile(uid);
  return { title: profile.name ?? "Profile" };
}

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const [{ uid }, sp, locale] = await Promise.all([params, searchParams, getLocale()]);
  const { profile, actor } = await loadProfile(uid);
  const data = serializeProfile(profile, locale);
  const tab = typeof sp.tab === "string" ? sp.tab : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ProfileView
        profile={data}
        activeTab={tab}
        basePath={`/users/${data.id}`}
        editProfileHref={actor === data.id ? "/users/profile" : undefined}
      />
    </div>
  );
}
