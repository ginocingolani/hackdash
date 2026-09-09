import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Picks up src/i18n/request.ts (cookie-based locale, no URL prefixes).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Message catalogs are read from the filesystem at request time
  // (src/i18n/request.ts); make sure they ship with traced output.
  outputFileTracingIncludes: {
    "/**": ["./messages/**/*"],
  },
};

export default withNextIntl(nextConfig);
