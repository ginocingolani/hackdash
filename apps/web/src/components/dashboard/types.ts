import type { ProjectStatus } from "@hackdash/db/shared";

// Plain serialized shapes passed from server pages into the client wall.

export interface WallProject {
  _id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  cover: string | null;
  tags: string[];
  contributorsCount: number;
  /** Pre-localized, e.g. "5 contributors". */
  contributorsLabel: string;
  /** Pre-localized relative time, e.g. "2 days ago". */
  createdAgo: string;
  /** ISO timestamp for client-side date sorting. */
  createdAt: string;
}

export interface WallAdmin {
  _id: string;
  name: string;
  username: string | null;
  picture: string | null;
}

export interface WallDashboard {
  domain: string;
  title: string | null;
  description: string | null;
  link: string | null;
  open: boolean;
  showcase: string[];
  /** Whether the current viewer owns the dashboard (may delete it). */
  isOwner: boolean;
}

export type StatusLabels = Record<ProjectStatus, string>;

export type WallSort = "name" | "date" | "showcase";

export function parseWallSort(value: unknown): WallSort {
  return value === "name" || value === "showcase" ? value : "date";
}
