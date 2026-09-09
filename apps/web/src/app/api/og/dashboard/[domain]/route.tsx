import { ImageResponse } from "next/og";
import { getDashboard, ServiceError } from "@hackdash/db";
import { db } from "@/lib/db";
import { OG_IMAGE_SIZE } from "@/lib/og";

export const dynamic = "force-dynamic";

// Social card for a dashboard: ink ground, the 2×2 diamond cluster, title,
// project count and /domain. Media Party palette, spec: docs/design/
// media-party-design-system.md. Uses the bundled default font (regular only),
// so hierarchy comes from size, color and tracking — not weight.

const MP = {
  ink: "#0B2A47",
  red: "#FF4654",
  yellow: "#FFDC00",
  cyan: "#00D7FB",
  blue: "#0071AC",
  orange: "#FE9144",
  plum: "#58253A",
};

function Diamond({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.round(size * 0.22),
        transform: "rotate(45deg)",
        opacity,
      }}
    />
  );
}

export async function GET(_request: Request, ctx: { params: Promise<{ domain: string }> }) {
  const { domain } = await ctx.params;
  let title = domain;
  let projectsCount = 0;
  try {
    await db();
    const dashboard = await getDashboard(domain);
    title = dashboard.title?.trim() || domain;
    projectsCount = dashboard.projectsCount ?? 0;
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) {
      return new Response("Not found", { status: 404 });
    }
    // Any other failure (e.g. no database in a preview) falls through and
    // renders the card from the domain alone.
  }

  const countLine = `${projectsCount} ${projectsCount === 1 ? "project" : "projects"}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: MP.ink,
          padding: "72px 80px",
        }}
      >
        {/* 2×2 diamond cluster — the icon-only Media Party mark */}
        <div style={{ display: "flex", gap: 26, marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ display: "flex", gap: 26 }}>
              <Diamond size={52} color={MP.blue} />
              <Diamond size={52} color={MP.red} />
            </div>
            <div style={{ display: "flex", gap: 26 }}>
              <Diamond size={52} color={MP.orange} />
              <Diamond size={52} color={MP.yellow} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
            <div
              style={{
                display: "flex",
                fontSize: title.length > 34 ? 58 : 76,
                lineHeight: 1.1,
                color: "#FFFFFF",
              }}
            >
              {title.length > 70 ? `${title.slice(0, 69)}…` : title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", fontSize: 30, color: MP.cyan }}>{countLine}</div>
              <Diamond size={12} color={MP.yellow} />
              <div style={{ display: "flex", fontSize: 30, color: "#9DB4CB" }}>/{domain}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: "0.3em",
              color: "#FFFFFF",
            }}
          >
            HACKDASH
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <Diamond size={18} color={MP.red} />
            <Diamond size={18} color={MP.blue} />
            <Diamond size={18} color={MP.cyan} />
            <Diamond size={18} color={MP.yellow} />
            <Diamond size={18} color={MP.orange} />
          </div>
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
