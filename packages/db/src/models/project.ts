import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { PROJECT_STATUSES } from "../statuses";

// Ported from legacy/lib/models/project.js. Collection: "projects".
// `domain` is a denormalized dashboard domain string, not a ref — the join
// key inherited from legacy data.
const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    domain: String,
    description: { type: String, required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: PROJECT_STATUSES, default: PROJECT_STATUSES[0] },
    contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    cover: String,
    link: String,
    tags: [String],
    created_at: { type: Date, default: Date.now },
  },
  {
    collection: "projects",
    // updated_at powers the "recently active" sort; created_at keeps its
    // legacy default so existing documents are untouched.
    timestamps: { createdAt: false, updatedAt: "updated_at" },
  }
);

projectSchema.index({ domain: 1 });
projectSchema.index({ created_at: -1 });

export type Project = InferSchemaType<typeof projectSchema>;
export const ProjectModel: Model<Project> =
  models.Project ?? model<Project>("Project", projectSchema);
