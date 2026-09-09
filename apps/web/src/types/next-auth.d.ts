import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      // Legacy users._id — the application user id.
      id?: string;
    } & DefaultSession["user"];
  }
}
