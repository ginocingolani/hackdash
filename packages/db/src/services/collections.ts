import { DashboardCollectionModel } from "../models/collection";
import { DashboardModel } from "../models/dashboard";
import { USER_PUBLIC_FIELDS } from "../models/user";
import { ServiceError, forbidden, notFound } from "../errors";
import { escapeRegex } from "../helpers";

// The entire legacy collections write path was broken (bug #1: promise
// misuse). This service is the working replacement.

const POPULATED = [
  { path: "owner", select: USER_PUBLIC_FIELDS },
  { path: "dashboards", select: "-__v" },
];

export async function listCollections({ q, limit, maxLimit = 50 }: { q?: string; limit?: number; maxLimit?: number } = {}) {
  const effectiveLimit = Math.min(limit || maxLimit, maxLimit);
  const query = q
    ? {
        $or: [
          { title: new RegExp(escapeRegex(q), "i") },
          { description: new RegExp(escapeRegex(q), "i") },
        ],
      }
    : {};
  return DashboardCollectionModel.find(query)
    .select("-__v")
    .sort({ created_at: -1 })
    .limit(effectiveLimit)
    .populate(POPULATED);
}

export async function listOwnCollections(actorId: string) {
  return DashboardCollectionModel.find({ owner: actorId }).select("-__v").populate(POPULATED);
}

export async function getCollection(cid: string) {
  const collection = await DashboardCollectionModel.findById(cid).select("-__v").populate(POPULATED);
  if (!collection) throw notFound();
  return collection;
}

export async function createCollection(actorId: string, input: { title?: string; description?: string }) {
  if (!input.title?.trim()) throw new ServiceError("title_required", 400);
  const collection = await DashboardCollectionModel.create({
    owner: actorId,
    title: input.title.trim(),
    description: input.description?.trim(),
  });
  return getCollection(String(collection._id));
}

async function getOwned(cid: string, actorId: string) {
  const collection = await DashboardCollectionModel.findById(cid);
  if (!collection) throw notFound();
  if (String(collection.owner) !== String(actorId)) throw forbidden();
  return collection;
}

export async function updateCollection(cid: string, actorId: string, patch: { title?: string; description?: string }) {
  const collection = await getOwned(cid, actorId);
  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new ServiceError("title_required", 400);
    collection.title = patch.title.trim();
  }
  if (patch.description !== undefined) collection.description = patch.description;
  await collection.save();
  return getCollection(cid);
}

export async function deleteCollection(cid: string, actorId: string): Promise<void> {
  const collection = await getOwned(cid, actorId);
  await collection.deleteOne();
}

export async function addDashboardToCollection(cid: string, actorId: string, dashboardId: string): Promise<void> {
  await getOwned(cid, actorId);
  const dashboard = await DashboardModel.findById(dashboardId);
  if (!dashboard) throw notFound();
  await DashboardCollectionModel.updateOne({ _id: cid }, { $addToSet: { dashboards: dashboard._id } });
}

export async function removeDashboardFromCollection(cid: string, actorId: string, dashboardId: string): Promise<void> {
  await getOwned(cid, actorId);
  await DashboardCollectionModel.updateOne({ _id: cid }, { $pull: { dashboards: dashboardId } });
}
