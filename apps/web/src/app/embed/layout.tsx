import type { Metadata } from "next";
import type { ReactNode } from "react";

// Chromeless shell for the iframe embed surfaces. The root layout (shared,
// read-only) renders the site header and footer as direct children of <body>;
// embeds must show neither, so this subtree suppresses exactly those two
// elements. The style only ships on /embed/* routes. Note this is site
// chrome, not `hide=` handling — legacy hide tokens are honored by not
// rendering the element at all (see the embed pages).
const CHROMELESS = "body > header, body > footer { display: none }";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-surface p-3 text-ink">
      <style>{CHROMELESS}</style>
      {children}
    </div>
  );
}
