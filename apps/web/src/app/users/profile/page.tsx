import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getProfile } from "@hackdash/db";
import { currentUserId } from "@/auth";
import { db } from "@/lib/db";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { CreateCollectionForm } from "@/components/profile/CreateCollectionForm";
import { serializeProfile, type ProfileAggregate } from "@/components/profile/serialize";

// Own profile: everything the public profile shows, plus the edit form,
// collection creation (restored write path, item 35) and guarded dashboard
// removal on the Dashboards tab. Anonymous visitors go to sign-in.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile.edit");
  return { title: t("title") };
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OwnProfilePage({ searchParams }: Props) {
  const uid = await currentUserId();
  if (!uid) redirect("/api/auth/signin");

  await db();
  const [profile, sp, locale] = await Promise.all([
    getProfile(uid, uid) as unknown as Promise<ProfileAggregate>,
    searchParams,
    getLocale(),
  ]);
  const data = serializeProfile(profile, locale);
  const tab = typeof sp.tab === "string" ? sp.tab : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ProfileView
        profile={data}
        activeTab={tab}
        basePath="/users/profile"
        manageDashboards
        toolsSlot={
          <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-2">
            <ProfileEditForm
              uid={data.id}
              name={profile.name ?? ""}
              email={profile.email ?? ""}
              bio={profile.bio ?? ""}
            />
            <CreateCollectionForm />
          </div>
        }
      />
    </div>
  );
}
