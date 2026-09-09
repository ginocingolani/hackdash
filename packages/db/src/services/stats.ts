import { DashboardModel } from "../models/dashboard";
import { ProjectModel } from "../models/project";
import { UserModel } from "../models/user";
import { DashboardCollectionModel } from "../models/collection";

export interface SiteCounts {
  dashboards: number;
  projects: number;
  users: number;
  collections: number;
  releases: number;
}

// Replaces the legacy metrics cron + unauthenticated /counts file read
// (bug #8): computed on demand from live data; the route layer caches it.
export async function getSiteCounts(): Promise<SiteCounts> {
  const [dashboards, projects, users, collections, releases] = await Promise.all([
    DashboardModel.estimatedDocumentCount(),
    ProjectModel.estimatedDocumentCount(),
    UserModel.estimatedDocumentCount(),
    DashboardCollectionModel.estimatedDocumentCount(),
    ProjectModel.countDocuments({ status: "releasing" }),
  ]);
  return { dashboards, projects, users, collections, releases };
}
