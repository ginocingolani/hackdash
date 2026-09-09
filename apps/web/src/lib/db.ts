import { connectDb } from "@hackdash/db";
import { env } from "./env";

// Every server-side entry point that touches data calls this first; the
// underlying connection is created once and reused.
export function db() {
  return connectDb(env.mongodbUri);
}
