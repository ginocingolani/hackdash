import { ImageResponse } from "next/og";
import { getProject, PROJECT_STATUSES, ServiceError } from "@hackdash/db";
import { db } from "@/lib/db";
import { OG_IMAGE_SIZE } from "@/lib/og";

export const dynamic = "force-dynamic";

// Social card for a project: ink ground, title, the 6-segment status bar
// rendered as rounded rects (filled = action red, the final "releasing"
// segment fills yellow — the celebratory Media Party color), and the
// dashboard domain. Palette per docs/design/media-party-design-system.md.

const MP = {
  ink: "#0B2A47",
  red: "#FF4654",
  yellow: "#FFDC00",
  cyan: "#00D7FB",
  blue: "#0071AC",
  orange: "#FE9144",
  line: "#1D4160",
};

export async function GET(_request: Request, ctx: { params: Promise<{ pid: string }> }) {
  const { pid } = await ctx.params;
  let title: string;
  let domain: string | null = null;
  let statusIndex = 0;
  let statusLabel: string = PROJECT_STATUSES[0];
  try {
    await db();
    const project = await getProject(pid);
    title = project.title;
    domain = project.domain ?? null;
    statusIndex = Math.max(0, PROJECT_STATUSES.indexOf(project.status ?? PROJECT_STATUSES[0]));
    statusLabel = project.status ?? PROJECT_STATUSES[0];
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) {
      return new Response("Not found", { status: 404 });
    }
    console.error(error);
    return new Response("Failed to generate the image", { status: 500 });
  }

  const stageLabel = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);

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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 34,
              height: 34,
              backgroundColor: MP.cyan,
              borderRadius: 8,
              transform: "rotate(45deg)",
            }}
          />
          {domain ? (
            <div style={{ display: "flex", fontSize: 30, color: "#9DB4CB" }}>/{domain}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 34 ? 58 : 76,
              lineHeight: 1.1,
              color: "#FFFFFF",
              maxWidth: 1000,
            }}
          >
            {title.length > 70 ? `${title.slice(0, 69)}…` : title}
          </div>
        </div>

        {/* Status bar: 6 rounded rects, red fills, yellow final segment */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {PROJECT_STATUSES.map((stage, i) => (
              <div
                key={stage}
                style={{
                  display: "flex",
                  width: 158,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor:
                    i <= statusIndex ? (stage === "releasing" ? MP.yellow : MP.red) : MP.line,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 30, color: MP.cyan }}>
              {`${stageLabel} — ${statusIndex + 1}/${PROJECT_STATUSES.length}`}
            </div>
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
          </div>
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
