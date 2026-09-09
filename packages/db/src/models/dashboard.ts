import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const DASHBOARD_DOMAIN_REGEX = /^[a-z0-9]{5,10}$/;

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
  models.Dashboard ?? model<Dashboard>("Dashboard", dashboardSchema);
