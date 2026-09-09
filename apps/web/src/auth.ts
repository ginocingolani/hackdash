import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Nodemailer from "next-auth/providers/nodemailer";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import { findOrCreateAuthUser } from "@hackdash/db";
import { env } from "./lib/env";
import { db } from "./lib/db";

// Auth.js state lives in auth_* collections so it can never collide with the
// legacy `users` collection. The legacy-shape user document remains the
// profile store: on sign-in we find-or-create one (matching returning GitHub
// users by provider id, magic-link users by email) and carry its _id in the
// JWT as the application user id.

// Lazy so importing this module (e.g. at build time) never requires env.
let clientPromise: Promise<MongoClient> | null = null;
function getClient(): Promise<MongoClient> {
  if (!clientPromise) clientPromise = MongoClient.connect(env.mongodbUri);
  return clientPromise;
}

const providers = [
  ...(env.github ? [GitHub({ clientId: env.github.clientId, clientSecret: env.github.clientSecret })] : []),
  Nodemailer({
    server: env.emailServer ?? { host: "localhost", port: 25 },
    from: env.emailFrom,
    ...(env.emailServer
      ? {}
      : {
          // Dev fallback: no SMTP configured — print the magic link instead.
          async sendVerificationRequest({ identifier, url }) {
            console.log(`\n[hackdash] Magic link for ${identifier}:\n${url}\n`);
          },
        }),
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(getClient, {
    collections: {
      Users: "auth_users",
      Accounts: "auth_accounts",
      Sessions: "auth_sessions",
      VerificationTokens: "auth_verification_tokens",
    },
  }),
  session: { strategy: "jwt" },
  providers,
  // Auth.js default sign-in page for now; the branded /login page arrives
  // with the design phase.
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account) {
        await db();
        const legacyUser = await findOrCreateAuthUser(
          account.provider === "github"
            ? {
                provider: "github",
                providerId: account.providerAccountId,
                email: user?.email ?? (profile?.email as string | undefined),
                name: user?.name ?? (profile?.name as string | undefined),
                username: (profile as { login?: string } | null)?.login,
                picture: user?.image ?? (profile?.picture as string | undefined),
              }
            : {
                provider: "email",
                providerId: user?.email ?? String(token.email ?? ""),
                email: user?.email ?? (token.email as string | undefined),
                name: user?.name,
              }
        );
        token.uid = String(legacyUser._id);
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
    // Legacy had an open redirect via ?redirect= — only same-origin paths
    // survive here.
    redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        /* fall through */
      }
      return baseUrl;
    },
  },
});

// The current application user id (legacy users._id), or null.
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
