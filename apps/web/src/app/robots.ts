import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/og";

// Crawlers get the public site; the API, iframe embed surfaces and auth
// endpoints are not standalone pages and stay out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/embed/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
