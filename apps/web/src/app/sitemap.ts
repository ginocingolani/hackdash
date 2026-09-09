import type { MetadataRoute } from "next";
import {
  listCollections,
  listDashboards,
  listProjects,
  searchUsers,
} from "@hackdash/db";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/og";

// Sitemap over the public entity pages, built from the @hackdash/db services
// (legacy parity item 47: prerender/sitemap/OG metas). Absolute URLs come
// from env SITE_URL via the og helper.

const MAX_ENTRIES = 5000;

interface Stamped {
  created_at?: Date;
  updated_at?: Date;
}

const lastModified = (doc: Stamped) => doc.updated_at ?? doc.created_at ?? undefined;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/dashboards"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/projects"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/collections"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/users"), changeFrequency: "weekly", priority: 0.5 },
  ];

  try {
    await db();
    const wide = { limit: MAX_ENTRIES, maxLimit: MAX_ENTRIES };
    const [dashboards, projects, collections, users] = await Promise.all([
      listDashboards(wide),
      listProjects(wide),
      listCollections(wide),
      searchUsers(wide),
    ]);

    for (const dashboard of dashboards) {
      if (!dashboard.domain) continue;
      entries.push({
        url: absoluteUrl(`/dashboards/${encodeURIComponent(dashboard.domain)}`),
        lastModified: lastModified(dashboard),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const project of projects) {
      entries.push({
        url: absoluteUrl(`/projects/${String(project._id)}`),
        lastModified: lastModified(project),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const collection of collections) {
      entries.push({
        url: absoluteUrl(`/collections/${String(collection._id)}`),
        lastModified: lastModified(collection),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const user of users) {
      entries.push({
        url: absoluteUrl(`/users/${String(user._id)}`),
        lastModified: lastModified(user),
        changeFrequency: "monthly",
        priority: 0.3,
      });
    }
  } catch (error) {
    // No database (e.g. build without MONGODB_URI): ship the static pages.
    console.error("sitemap: entity listing skipped", error);
  }

  return entries;
}
