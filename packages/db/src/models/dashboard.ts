import mongoose from "mongoose";
import type { InferSchemaType, Model } from "mongoose";
const { Schema } = mongoose;

// Canonical definition lives in ../shared (the client-safe subpath);
// re-exported here so server code keeps importing it from the package root.
import { DASHBOARD_DOMAIN_REGEX } from "../shared";
export { DASHBOARD_DOMAIN_REGEX };

// Ported from legacy/lib/models/dashboard.js. Collection: "dashboards".
// `covers` and `projectsCount` are denormalized caches recomputed on project
// writes (legacy behavior the service layer must preserve until replaced).
// NOTE: `domain` has no unique index yet — legacy never enforced uniqueness at
// the DB level and production data must be audited for duplicates before one
// is added. Uniqueness is enforced in the service layer meanwhile.
const dashboardSchema = new Schema(
  {
    domain: { type: String, match: DASHBOARD_DOMAIN_REGEX },
    title: String,
    description: String,
    link: String,
    open: { type: Boolean, default: true },
    showcase: [String],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    covers: [String],
    projectsCount: Number,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "dashboards" }
);

dashboardSchema.index({ domain: 1 });

export type Dashboard = InferSchemaType<typeof dashboardSchema>;
export const DashboardModel: Model<Dashboard> =
  (mongoose.models.Dashboard as Model<Dashboard> | undefined) ?? mongoose.model<Dashboard>("Dashboard", dashboardSchema);
