import { UserModel, USER_PUBLIC_FIELDS, type User } from "../models/user";
import { DashboardModel } from "../models/dashboard";
import { ProjectModel } from "../models/project";
import { DashboardCollectionModel } from "../models/collection";
import { ServiceError, forbidden, notFound } from "../errors";
import { escapeRegex } from "../helpers";
import { isDashboardAdmin } from "./dashboards";

const EMAIL_REGEX = /.+@.+\..+/;

export async function listAdmins(domain: string) {
  return UserModel.find({ admin_in: domain }).select(USER_PUBLIC_FIELDS);
}

export async function grantAdmin(domain: string, actorId: string, targetUserId: string) {
  if (!(await isDashboardAdmin(actorId, domain))) throw forbidden();
  const result = await UserModel.updateOne(
    { _id: targetUserId },
    { $addToSet: { admin_in: domain } }
  );
  if (result.matchedCount === 0) throw notFound();
}

// New in the rewrite: legacy had no revocation at all (bug #12).
export async function revokeAdmin(domain: string, actorId: string, targetUserId: string) {
  if (!(await isDashboardAdmin(actorId, domain))) throw forbidden();
  const adminCount = await UserModel.countDocuments({ admin_in: domain });
  if (adminCount <= 1) throw new ServiceError("last_admin", 409);
  const result = await UserModel.updateOne(
    { _id: targetUserId },
    { $pull: { admin_in: domain } }
  );
  if (result.matchedCount === 0) throw notFound();
}

export async function searchUsers({ q, limit = 50, maxLimit = 50 }: { q?: string; limit?: number; maxLimit?: number } = {}) {
  const effectiveLimit = Math.min(limit, maxLimit);
  // Landing filter without $where: only users with a non-empty bio.
  // Legacy also matched q against email; that let anyone probe accounts by
  // address, so the rewrite searches name/username only.
  const query = q
    ? {
        $or: [
          { name: new RegExp(escapeRegex(q), "i") },
          { username: new RegExp(escapeRegex(q), "i") },
        ],
      }
    : { bio: { $exists: true, $nin: [null, ""] } };
  return UserModel.find(query)
    .select(USER_PUBLIC_FIELDS)
    .sort({ created_at: -1, name: 1, username: 1 })
    .limit(effectiveLimit);
}

export async function getTeam(ids: string[]) {
  const users = await UserModel.find({ _id: { $in: ids } }).select(
    "_id name picture bio provider username"
  );
  // Preserve config order.
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return ids.map((id) => byId.get(id)).filter((u) => !!u);
}

// Email is visible only to the user themself — tightens legacy, which showed
// it to any authenticated requester.
export async function getUser(uid: string, actorId?: string) {
  const includeEmail = actorId != null && String(actorId) === String(uid);
  const user = await UserModel.findById(uid).select(
    includeEmail ? "-__v -provider_id" : USER_PUBLIC_FIELDS
  );
  if (!user) throw notFound();
  return user;
}

// The legacy aggregate profile: user + owned collections + admin dashboards
// + led projects + contributions (not leader) + likes (follower, not leader).
export async function getProfile(uid: string, actorId?: string) {
  const user = await getUser(uid, actorId);
  const [collections, dashboards, projects, contributions, likes] = await Promise.all([
    DashboardCollectionModel.find({ owner: uid }).select("-__v"),
    DashboardModel.find({ domain: { $in: user.admin_in ?? [] } }).select("-__v"),
    ProjectModel.find({ leader: uid }).select("-__v"),
    ProjectModel.find({ contributors: uid, leader: { $ne: uid } }).select("-__v"),
    ProjectModel.find({ followers: uid, leader: { $ne: uid } }).select("-__v"),
  ]);
  return { ...user.toObject(), collections, dashboards, projects, contributions, likes };
}

export async function updateProfile(
  uid: string,
  actorId: string,
  patch: { name?: string; email?: string; bio?: string }
) {
  if (String(uid) !== String(actorId)) throw forbidden();
  // Legacy bug #9: it wrote to req.user instead of the looked-up target.
  const user = await UserModel.findById(uid);
  if (!user) throw notFound();
  if (!patch.name?.trim()) throw new ServiceError("name_required", 400);
  if (!patch.email?.trim()) throw new ServiceError("email_required", 400);
  if (!EMAIL_REGEX.test(patch.email)) throw new ServiceError("email_invalid", 400);
  user.name = patch.name.trim();
  user.email = patch.email.trim();
  if (patch.bio !== undefined) user.bio = patch.bio;
  await user.save();
  return user;
}

export interface OAuthProfile {
  provider: string;
  providerId: string | number;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  picture?: string | null;
}

// Bridge between Auth.js and the legacy-shape users collection. Matching by
// provider+provider_id keeps returning users; matching magic-link sign-ins by
// email attaches them to their existing account when one exists.
export async function findOrCreateAuthUser(profile: OAuthProfile): Promise<User & { _id: unknown }> {
  const byProvider = await UserModel.findOne({
    provider: profile.provider,
    // Legacy stored ids as Numbers, newer providers use strings — match both.
    provider_id: { $in: [String(profile.providerId), Number(profile.providerId)].filter((v) => v === v) },
  });
  if (byProvider) {
    if (profile.picture && byProvider.picture !== profile.picture) {
      byProvider.picture = profile.picture;
      await byProvider.save();
    }
    return byProvider;
  }
  if (profile.email) {
    const byEmail = await UserModel.findOne({ email: profile.email });
    if (byEmail) return byEmail;
  }
  const name = profile.name || profile.username || profile.email?.split("@")[0] || "Someone";
  const username = profile.username || profile.email?.split("@")[0] || `user${Date.now()}`;
  return UserModel.create({
    provider: profile.provider,
    provider_id: String(profile.providerId),
    name,
    username,
    email: profile.email || undefined,
    picture: profile.picture || undefined,
  });
}
