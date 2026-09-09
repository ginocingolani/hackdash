// Canonical project status lifecycle. The legacy server and client disagreed
// on the ORDER of this list (see docs/legacy/client.md §1); the server's order
// is canonical and the progress-bar rendering must derive from this array only.
export const PROJECT_STATUSES = [
  "brainstorming",
  "wireframing",
  "building",
  "researching",
  "prototyping",
  "releasing",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
