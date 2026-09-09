import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DiscoveryView } from "@/components/discovery/DiscoveryView";
import { parseDiscoveryParams } from "@/components/discovery/data";

// Pre-filtered discovery view (§2.2 item 5): the collections grid with
// URL-synced search. searchParams is a Promise in Next 16.

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("collections") };
}

export default async function CollectionsPage({ searchParams }: Props) {
  const { q, limit } = parseDiscoveryParams(await searchParams);
  return <DiscoveryView kind="collections" q={q} limit={limit} />;
}
