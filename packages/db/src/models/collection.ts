import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

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
  models.Collection ?? model<DashboardCollection>("Collection", collectionSchema);
