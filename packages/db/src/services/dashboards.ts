import { DashboardModel, DASHBOARD_DOMAIN_REGEX, type Dashboard } from "../models/dashboard";
import { ProjectModel } from "../models/project";
import { UserModel } from "../models/user";
import { ServiceError, forbidden, notFound } from "../errors";
import { escapeRegex, httpPrefix } from "../helpers";

// Slugs that collide with routes or subdomains and can never be dashboards.
export const RESERVED_DOMAINS = new Set([
  "www", "api", "app", "admin", "auth", "login", "logout", "embed", "embeds",
  "users", "projects", "dashboards", "collections", "profiles", "assets",
  "static", "uploads", "mail", "blog", "docs", "help", "status", "live",
]);

export function validateDomain(domain: string): void {
  if (!DASHBOARD_DOMAIN_REGEX.test(domain) || RESERVED_DOMAINS.has(domain)) {
    throw new ServiceError("subdomain_invalid", 400);
  }
}

export async function isDomainAvailable(domain: string): Promise<boolean> {
  return !(await DashboardModel.exists({ domain }));
}

export async function createDashboard(actorId: string, domain: string): Promise<Dashboard> {
  validateDomain(domain);
  if (!(await isDomainAvailable(domain))) {
    throw new ServiceError("subdomain_inuse", 409);
  }
  const dashboard = await DashboardModel.create({ domain, owner: actorId });
  await UserModel.updateOne({ _id: actorId }, { $addToSet: { admin_in: domain } });
  return dashboard;
}

export async function getDashboard(domain: string) {
  const dashboard = await DashboardModel.findOne({ domain })
    .select("-__v")
    .populate("owner", "_id name picture bio");
  if (!dashboard) throw notFound();
  return dashboard;
}

export interface SearchOptions {
  q?: string;
  limit?: number;
  page?: number;
  maxLimit?: number;
}

export async function listDashboards({ q, limit, page = 0, maxLimit = 50 }: SearchOptions = {}) {
  const effectiveLimit = Math.min(limit || maxLimit, maxLimit);
  // Landing filter without the legacy $where: dashboards with more than one
  // project and at least one cover.
  const query = q
    ? {
        $or: [
          { domain: new RegExp(escapeRegex(q), "i") },
          { title: new RegExp(escapeRegex(q), "i") },
          { description: new RegExp(escapeRegex(q), "i") },
        ],
      }
    : { projectsCount: { $gt: 1 }, "covers.0": { $exists: true } };
  return DashboardModel.find(query)
    .select("-__v")
    .sort({ created_at: -1 })
    .skip(page * effectiveLimit)
    .limit(effectiveLimit);
}

export async function isDashboardAdmin(actorId: string, domain: string): Promise<boolean> {
  const user = await UserModel.findById(actorId).select("admin_in");
  return !!user?.admin_in?.includes(domain);
}

export interface DashboardPatch {
  title?: string;
  description?: string;
  link?: string;
  open?: boolean;
  showcase?: string[];
}

export async function updateDashboard(domain: string, actorId: string, patch: DashboardPatch) {
  if (!(await isDashboardAdmin(actorId, domain))) throw forbidden();
  const dashboard = await DashboardModel.findOne({ domain });
  if (!dashboard) throw notFound();
  if (patch.title !== undefined) dashboard.title = patch.title;
  if (patch.description !== undefined) dashboard.description = patch.description;
  if (patch.link !== undefined) dashboard.link = httpPrefix(patch.link);
  if (patch.open !== undefined) dashboard.open = !!patch.open;
  // Legacy contract: showcase is only replaced when an actual array arrives.
  if (Array.isArray(patch.showcase)) dashboard.showcase = patch.showcase.map(String);
  await dashboard.save();
  return dashboard;
}

export async function deleteDashboard(domain: string, actorId: string): Promise<void> {
  const dashboard = await DashboardModel.findOne({ domain });
  if (!dashboard) throw notFound();
  if (!dashboard.owner || String(dashboard.owner) !== String(actorId)) throw forbidden();
  if ((dashboard.projectsCount ?? 0) > 0) {
    throw new ServiceError("dashboard_has_projects", 409);
  }
  // Legacy bug #2: this count was never awaited, so the guard never fired.
  const adminCount = await UserModel.countDocuments({ admin_in: domain });
  if (adminCount > 1) {
    throw new ServiceError("dashboard_has_admins", 409);
  }
  await dashboard.deleteOne();
  await UserModel.updateMany({ admin_in: domain }, { $pull: { admin_in: domain } });
}

// Legacy denormalization (docs/legacy/server.md §2): dashboards cache their
// projects' covers and count; recomputed on every project write.
export async function recomputeDashboardDenorms(domain: string): Promise<void> {
  const projects = await ProjectModel.find({ domain }).select("cover");
  await DashboardModel.updateOne(
    { domain },
    {
      $set: {
        projectsCount: projects.length,
        covers: projects.map((p) => p.cover).filter((c): c is string => !!c),
      },
    }
  );
}
