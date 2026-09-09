import mongoose from "mongoose";
import type { InferSchemaType, Model } from "mongoose";
const { Schema } = mongoose;

// Ported from legacy/lib/models/collection.js. Collection: "collections".
const collectionSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    description: String,
    dashboards: [{ type: Schema.Types.ObjectId, ref: "Dashboard" }],
    created_at: { type: Date, default: Date.now },
  },
  { collection: "collections" }
);

export type DashboardCollection = InferSchemaType<typeof collectionSchema>;
export const DashboardCollectionModel: Model<DashboardCollection> =
  (mongoose.models.Collection as Model<DashboardCollection> | undefined) ?? mongoose.model<DashboardCollection>("Collection", collectionSchema);
