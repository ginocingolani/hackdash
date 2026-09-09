import type { Metadata } from "next";
import { PROJECT_STATUSES } from "@hackdash/db";
import { DiamondMark, Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DiamondAvatar,
  type EntityKind,
} from "@/components/ui/DiamondAvatar";
import { EntityBadge } from "@/components/ui/EntityBadge";
import { Input, SearchInput } from "@/components/ui/Input";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { StatusBar } from "@/components/ui/StatusBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = { title: "Styleguide" };

// Reference surface for every design-system primitive. Page agents: build
// screens from these components and tokens only — no raw hex in app code.

const ENTITIES: EntityKind[] = ["dashboard", "project", "user", "collection"];

const RAW_PALETTE: Array<{ name: string; cls: string; hex: string; note?: string }> = [
  { name: "mp-cyan", cls: "bg-mp-cyan", hex: "#00D7FB", note: "fill-only" },
  { name: "mp-yellow", cls: "bg-mp-yellow", hex: "#FFDC00", note: "fill-only" },
  { name: "mp-red", cls: "bg-mp-red", hex: "#FF4654", note: "action" },
  { name: "mp-ink", cls: "bg-mp-ink", hex: "#0B2A47", note: "text + dark ground" },
  { name: "mp-blue", cls: "bg-mp-blue", hex: "#0071AC" },
  { name: "mp-orange", cls: "bg-mp-orange", hex: "#FE9144" },
  { name: "mp-teal", cls: "bg-mp-teal", hex: "#04AECA" },
  { name: "mp-plum", cls: "bg-mp-plum", hex: "#58253A" },
  { name: "mp-crimson", cls: "bg-mp-crimson", hex: "#D32633" },
];

const SEMANTIC_TOKENS: Array<{ name: string; cls: string; role: string }> = [
  { name: "surface", cls: "bg-surface", role: "page ground" },
  { name: "raised", cls: "bg-raised", role: "cards, header, inputs" },
  { name: "ink", cls: "bg-ink", role: "primary text" },
  { name: "muted", cls: "bg-muted", role: "secondary text" },
  { name: "line", cls: "bg-line", role: "borders, hairlines" },
  { name: "action", cls: "bg-action", role: "the interactive color" },
  { name: "highlight", cls: "bg-highlight", role: "warnings, highlights" },
];

const ENTITY_TOKENS: Array<{ name: string; cls: string }> = [
  { name: "dashboard", cls: "bg-dashboard" },
  { name: "project", cls: "bg-project" },
  { name: "user", cls: "bg-user" },
  { name: "collection", cls: "bg-collection" },
];

// Inline SVG sample "photo" so the avatar image variant needs no network.
const SAMPLE_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#0071AC"/><circle cx="34" cy="30" r="22" fill="#00D7FB"/><circle cx="66" cy="66" r="30" fill="#FFDC00"/><circle cx="70" cy="26" r="12" fill="#FF4654"/></svg>`,
  );

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">{title}</h2>
      {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="flex items-center gap-2 text-muted">
        <DiamondMark size={18} />
        <Wordmark className="text-[11px] text-muted" />
      </p>
      <h1 className="mt-2 text-3xl font-bold">Design system</h1>
      <p className="mt-2 max-w-xl text-muted">
        Media Party 2024 palette, Poppins throughout, the rounded diamond as
        the signature shape. Every color in app code comes from these tokens.
      </p>

      <Section
        title="Raw palette"
        note="Theme-invariant brand fills. Cyan and yellow are FILL-ONLY — as text use teal, blue, or orange instead."
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {RAW_PALETTE.map((c) => (
            <div key={c.name}>
              <div
                className={`h-14 rounded-lg border border-line ${c.cls}`}
              />
              <p className="mt-1.5 text-xs font-medium">{c.name}</p>
              <p className="text-xs text-muted">
                {c.hex}
                {c.note ? ` · ${c.note}` : ""}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Semantic tokens"
        note="These flip with the theme (system / light / dark). Use them — not raw palette values — for UI surfaces and text."
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
          {SEMANTIC_TOKENS.map((tok) => (
            <div key={tok.name}>
              <div
                className={`h-14 rounded-lg border border-line ${tok.cls}`}
              />
              <p className="mt-1.5 text-xs font-medium">{tok.name}</p>
              <p className="text-xs text-muted">{tok.role}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Entity tokens"
        note="Semantic meaning only: badges, tabs, count chips, avatar fills — never arbitrary section theming."
      >
        <div className="grid grid-cols-4 gap-3">
          {ENTITY_TOKENS.map((tok) => (
            <div key={tok.name}>
              <div
                className={`h-14 rounded-lg border border-line ${tok.cls}`}
              />
              <p className="mt-1.5 text-xs font-medium">{tok.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography" note="One family: Poppins, 300–800.">
        <div className="space-y-3">
          <p className="text-xs font-extrabold tracking-[0.28em] uppercase">
            Wordmark treatment · 800 · 0.28em tracking
          </p>
          <p className="text-4xl font-bold">Display bold 36</p>
          <p className="text-2xl font-semibold">Heading semibold 24</p>
          <p className="text-xl font-medium">Subheading medium 20</p>
          <p className="text-base">Body regular 16 — the reading size.</p>
          <p className="text-base font-light text-muted">
            Subtitle light 16, muted.
          </p>
          <p className="text-sm text-muted">Caption 14, muted.</p>
        </div>
      </Section>

      <Section
        title="Status bar"
        note="Six segments, canonical order from @hackdash/db. Filled = action red; the final releasing segment fills yellow. sm hides the visible label but keeps it for screen readers."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {PROJECT_STATUSES.map((status) => (
            <StatusBar key={status} status={status} size="md" />
          ))}
        </div>
        <div className="mt-8 max-w-sm space-y-6">
          <StatusBar status="building" size="sm" />
          <StatusBar status="building" size="md" />
          <StatusBar status="building" size="lg" />
        </div>
      </Section>

      <Section
        title="Diamond avatar"
        note="Rotated rounded square (border-radius 22%), 40/64/96. Image, or deterministic initials on the raw entity color."
      >
        <div className="space-y-4">
          {ENTITIES.map((entity) => (
            <div key={entity} className="flex items-center gap-4">
              <span className="w-24 text-sm text-muted">{entity}</span>
              <DiamondAvatar name="Media Party" entity={entity} size="sm" />
              <DiamondAvatar name="Media Party" entity={entity} size="md" />
              <DiamondAvatar name="Media Party" entity={entity} size="lg" />
            </div>
          ))}
          <div className="flex items-center gap-4">
            <span className="w-24 text-sm text-muted">with image</span>
            <DiamondAvatar name="Sample" src={SAMPLE_IMAGE} size="sm" />
            <DiamondAvatar name="Sample" src={SAMPLE_IMAGE} size="md" />
            <DiamondAvatar name="Sample" src={SAMPLE_IMAGE} size="lg" />
          </div>
        </div>
      </Section>

      <Section title="Entity badge">
        <div className="flex flex-wrap gap-3">
          {ENTITIES.map((entity) => (
            <EntityBadge key={entity} entity={entity} />
          ))}
        </div>
      </Section>

      <Section
        title="Buttons"
        note="Primary is the only red element on a screen by default. Focus ring is always visible and action red — try Tab."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">New project</Button>
          <Button variant="secondary">Export CSV</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">
            New project
          </Button>
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm" href="/styleguide">
            As link
          </Button>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-3">
          <Input placeholder="Project title" aria-label="Project title" />
          <SearchInput placeholder="Search projects…" />
          <Input placeholder="Disabled" aria-label="Disabled example" disabled />
        </div>
      </Section>

      <Section
        title="Card"
        note="The base every entity card builds on. Interactive cards lift on hover (unless reduced motion)."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-semibold">Base card</h3>
            <p className="mt-1 text-sm text-muted">
              Raised surface, hairline border, 16px radius.
            </p>
          </Card>
          <Card interactive flush>
            <div className="h-20 bg-mp-cyan" />
            <div className="p-4">
              <h3 className="font-semibold">Interactive, flush</h3>
              <p className="mt-1 text-sm text-muted">
                Full-bleed cover strip; hovering lifts the card.
              </p>
              <StatusBar status="prototyping" size="sm" className="mt-3" />
            </div>
          </Card>
        </div>
      </Section>

      <Section
        title="Theme & language"
        note="Theme is three-state (system / light / dark), persisted in localStorage and stamped as data-theme. Language is a NEXT_LOCALE cookie — no URL prefixes."
      >
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </Section>

      <Section
        title="Brand motifs"
        note="The rounded diamond is the atomic shape: logo cluster, avatar frame, pattern cell."
      >
        <div className="flex items-center gap-6">
          <DiamondMark size={40} />
          <div aria-hidden="true" className="flex gap-3 overflow-hidden">
            {(
              [
                "bg-mp-red",
                "bg-mp-blue",
                "bg-mp-cyan",
                "bg-mp-yellow",
                "bg-mp-orange",
              ] as const
            ).map((cls, i) => (
              <span
                key={i}
                className={`h-4 w-4 shrink-0 rotate-45 rounded-[22%] ${cls}`}
              />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
