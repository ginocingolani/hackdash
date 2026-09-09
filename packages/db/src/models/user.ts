import mongoose from "mongoose";
import type { InferSchemaType, Model } from "mongoose";
const { Schema } = mongoose;

// Ported field-for-field from legacy/lib/models/user.js so existing
// hackdash.org documents remain readable. Collection: "users".
const userSchema = new Schema(
  {
    provider: { type: String, required: true },
    // Legacy declared Number, but provider ids are strings for some providers;
    // production data holds both. Mixed until a normalization migration runs.
    provider_id: { type: Schema.Types.Mixed, required: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, match: /.+@.+\..+/ },
    picture: String,
    // Dashboard `domain` strings — the legacy authorization model.
    admin_in: { type: [String], default: [] },
    bio: String,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "users" }
);

userSchema.index({ provider: 1, provider_id: 1 });

export type User = InferSchemaType<typeof userSchema>;
export const UserModel: Model<User> = (mongoose.models.User as Model<User> | undefined) ?? mongoose.model<User>("User", userSchema);

// Legacy privacy mask applied when populating users into public payloads.
export const USER_PUBLIC_FIELDS = "-__v -email -provider_id";
