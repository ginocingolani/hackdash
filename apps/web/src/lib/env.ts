// Typed, validated access to server-side environment. Fail fast on what is
// required; provide dev-friendly defaults for the rest (see .env.example).

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export const env = {
  get mongodbUri() {
    return required("MONGODB_URI");
  },
  get siteUrl() {
    return process.env.SITE_URL || "http://localhost:3000";
  },
  get maxQueryLimit() {
    const parsed = Number(process.env.MAX_QUERY_LIMIT);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
  },
  get github() {
    const clientId = process.env.AUTH_GITHUB_ID;
    const clientSecret = process.env.AUTH_GITHUB_SECRET;
    return clientId && clientSecret ? { clientId, clientSecret } : null;
  },
  get emailServer() {
    return process.env.EMAIL_SERVER || null;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM || "HackDash <login@localhost>";
  },
};
