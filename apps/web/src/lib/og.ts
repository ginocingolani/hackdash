import type { Metadata } from "next";
import { env } from "./env";

// Small metadata/OG helper. Entity pages (dashboard, project) import these to
// get canonical absolute URLs and a filled-in Metadata object with the
// generated OG card; the OG images themselves are rendered by
// /api/og/dashboard/[domain] and /api/og/project/[pid].

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Site origin from env SITE_URL, without a trailing slash. */
export function siteOrigin(): string {
  return env.siteUrl.replace(/\/+$/, "");
}

/** Absolute URL on the main site for a path like "/projects/abc". */
export function absoluteUrl(path: string): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function dashboardOgImageUrl(domain: string): string {
  return absoluteUrl(`/api/og/dashboard/${encodeURIComponent(domain)}`);
}

export function projectOgImageUrl(pid: string): string {
  return absoluteUrl(`/api/og/project/${encodeURIComponent(pid)}`);
}

export interface EntityMetaInput {
  title: string;
  description?: string | null;
  /** Site-relative canonical path, e.g. "/dashboards/mediaparty". */
  path: string;
  /** Absolute OG image URL (defaults to none). */
  image?: string;
}

/** Default metadata fields for an entity page (title, canonical, OG, twitter). */
export function entityMetadata({ title, description, path, image }: EntityMetaInput): Metadata {
  const url = absoluteUrl(path);
  const desc = description?.trim() || undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "HackDash",
      type: "website",
      ...(image ? { images: [{ url: image, ...OG_IMAGE_SIZE }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function dashboardMetadata(dashboard: {
  domain: string;
  title?: string | null;
  description?: string | null;
}): Metadata {
  return entityMetadata({
    title: dashboard.title?.trim() || dashboard.domain,
    description: dashboard.description,
    path: `/dashboards/${encodeURIComponent(dashboard.domain)}`,
    image: dashboardOgImageUrl(dashboard.domain),
  });
}

export function projectMetadata(project: {
  _id: string;
  title: string;
  description?: string | null;
}): Metadata {
  return entityMetadata({
    title: project.title,
    description: project.description,
    path: `/projects/${encodeURIComponent(project._id)}`,
    image: projectOgImageUrl(project._id),
  });
}
