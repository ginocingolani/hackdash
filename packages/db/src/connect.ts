import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | null = null;

// Reuses a single connection across hot reloads / serverless invocations.
export function connectDb(uri = process.env.MONGODB_URI): Promise<typeof mongoose> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!connection) connection = mongoose.connect(uri);
  return connection;
}
