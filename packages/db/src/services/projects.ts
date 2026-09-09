import { ProjectModel, type Project } from "../models/project";
import { DashboardModel } from "../models/dashboard";
import { UserModel, USER_PUBLIC_FIELDS } from "../models/user";
import { PROJECT_STATUSES, type ProjectStatus } from "../statuses";
import { ServiceError, forbidden, notFound } from "../errors";
import { escapeRegex, httpPrefix, normalizeTags, sameId } from "../helpers";
import { isDashboardAdmin, recomputeDashboardDenorms } from "./dashboards";
import { activityBus, type ActivityEventType } from "../events";

const POPULATED = [
  { path: "leader", select: USER_PUBLIC_FIELDS },
  { path: "contributors", select: USER_PUBLIC_FIELDS },
  { path: "followers", select: USER_PUBLIC_FIELDS },
];

async function emitActivity(type: ActivityEventType, project: { _id: unknown; title: string; domain?: string | null }, actorId: string) {
  const user = await UserModel.findById(actorId).select("_id name username picture");
  if (!user || !project.domain) return;
  activityBus.emitActivity({
    type,
    domain: project.domain,
    projectId: String(project._id),
    projectTitle: project.title,
    user: {
      _id: String(user._id),
      name: user.name,
      username: user.username,
      picture: user.picture ?? undefined,
    },
    at: new Date(),
  });
}

export interface ListProjectsOptions {
  domain?: string;
  q?: string;
  limit?: number;
  maxLimit?: number;
}

export async function listProjects({ domain, q, limit, maxLimit = 50 }: ListProjectsOptions = {}) {
  // Legacy contract: a domain filter returns the dashboard's full list.
  const effectiveLimit = domain ? 0 : Math.min(limit || maxLimit, maxLimit);
  let query: Record<string, unknown>;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    query = { $or: [{ title: rx }, { description: rx }, { tags: rx }, { domain: rx }] };
    if (domain) query = { $and: [{ domain }, query] };
  } else if (domain) {
    query = { domain };
  } else {
    // Landing filter: only projects with a cover.
    query = { cover: { $exists: true, $nin: [null, ""] } };
  }
  return ProjectModel.find(query)
    .select("-__v")
    .sort({ created_at: -1 })
    .limit(effectiveLimit)
    .populate(POPULATED);
}

export async function getProject(pid: string) {
  const project = await ProjectModel.findById(pid).select("-__v").populate(POPULATED);
  if (!project) throw notFound();
  return project;
}

export interface ProjectInput {
  domain: string;
  title?: string;
  description?: string;
  link?: string;
  status?: string;
  tags?: unknown;
  cover?: string;
}

export async function createProject(actorId: string, input: ProjectInput) {
  if (!input.domain) throw new ServiceError("validation_failed", 400, "domain required");
  const dashboard = await DashboardModel.findOne({ domain: input.domain });
  if (!dashboard) throw notFound();
  if (!dashboard.open) throw new ServiceError("dashboard_closed", 403);
  if (!input.title?.trim()) throw new ServiceError("title_required", 400);
  if (!input.description?.trim()) throw new ServiceError("description_required", 400);
  const status = PROJECT_STATUSES.includes(input.status as ProjectStatus)
    ? (input.status as ProjectStatus)
    : PROJECT_STATUSES[0];
  const project = await ProjectModel.create({
    title: input.title.trim(),
    description: input.description.trim(),
    domain: input.domain,
    leader: actorId,
    contributors: [actorId],
    followers: [actorId],
    status,
    link: httpPrefix(input.link),
    tags: normalizeTags(input.tags),
    cover: input.cover || undefined,
  });
  await recomputeDashboardDenorms(input.domain);
  await emitActivity("project_created", project, actorId);
  return getProject(String(project._id));
}

async function assertCanEdit(project: Project & { _id: unknown }, actorId: string) {
  const isLeader = sameId(project.leader, actorId);
  if (isLeader) return;
  if (project.domain && (await isDashboardAdmin(actorId, project.domain))) return;
  throw forbidden();
}

export async function updateProject(pid: string, actorId: string, patch: Omit<ProjectInput, "domain">) {
  const project = await ProjectModel.findById(pid);
  if (!project) throw notFound();
  await assertCanEdit(project, actorId);
  const coverChanged = patch.cover !== undefined && patch.cover !== project.cover;
  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new ServiceError("title_required", 400);
    project.title = patch.title.trim();
  }
  if (patch.description !== undefined) {
    if (!patch.description.trim()) throw new ServiceError("description_required", 400);
    project.description = patch.description.trim();
  }
  if (patch.link !== undefined) project.link = httpPrefix(patch.link);
  if (patch.status !== undefined && PROJECT_STATUSES.includes(patch.status as ProjectStatus)) {
    project.status = patch.status as ProjectStatus;
  }
  if (patch.cover !== undefined) project.cover = patch.cover || undefined;
  if (patch.tags !== undefined) project.tags = normalizeTags(patch.tags);
  await project.save();
  if (coverChanged && project.domain) await recomputeDashboardDenorms(project.domain);
  await emitActivity("project_edited", project, actorId);
  return getProject(pid);
}

export async function deleteProject(pid: string, actorId: string): Promise<void> {
  const project = await ProjectModel.findById(pid);
  if (!project) throw notFound();
  await assertCanEdit(project, actorId);
  await project.deleteOne();
  if (project.domain) await recomputeDashboardDenorms(project.domain);
  await emitActivity("project_removed", project, actorId);
}

type Membership = "followers" | "contributors";

const MEMBERSHIP_EVENTS: Record<Membership, { add: ActivityEventType; remove: ActivityEventType }> = {
  followers: { add: "project_follow", remove: "project_unfollow" },
  contributors: { add: "project_join", remove: "project_leave" },
};

async function setMembership(pid: string, actorId: string, field: Membership, add: boolean) {
  const project = await ProjectModel.findById(pid);
  if (!project) throw notFound();
  // Legacy bug #4: ObjectId-vs-string compare meant this guard never fired.
  if (sameId(project.leader, actorId)) {
    throw new ServiceError("leader_cannot_leave", 406);
  }
  await ProjectModel.updateOne(
    { _id: pid },
    add ? { $addToSet: { [field]: actorId } } : { $pull: { [field]: actorId } }
  );
  await emitActivity(MEMBERSHIP_EVENTS[field][add ? "add" : "remove"], project, actorId);
}

export const followProject = (pid: string, actorId: string) => setMembership(pid, actorId, "followers", true);
export const unfollowProject = (pid: string, actorId: string) => setMembership(pid, actorId, "followers", false);
export const joinProject = (pid: string, actorId: string) => setMembership(pid, actorId, "contributors", true);
export const leaveProject = (pid: string, actorId: string) => setMembership(pid, actorId, "contributors", false);

export async function getStatusCounts(domain: string): Promise<Record<string, number>> {
  const rows = await ProjectModel.aggregate([
    { $match: { domain } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}
