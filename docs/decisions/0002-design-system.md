# ADR 0002 — Adopt the Media Party design system

**Status:** accepted · **Date:** 2026-09-09

## Context

The improvement plan (§3.1) originally proposed evolving the legacy HackDash
identity (`#FE3554`, Montserrat + system stack, hexagon avatars). Gino decided
instead to base the rewrite's visual identity on the **Media Party brand**
(2023/2024 style guides), reflecting HackDash's home community.

## Decision

Use the Media Party system as extracted in `docs/design/media-party-design-system.md`:

- Palette: 2024 primaries (`#00D7FB`, `#FFDC00`, `#FF4654`, `#0B2A47`) +
  secondaries (`#0071AC`, `#FE9144`, `#04AECA`, `#58253A`, `#D32633`).
- Typography: Poppins for all roles; wide-tracked bold caps for labels.
- Shape language: the rotated rounded-square "diamond" replaces the legacy
  hexagon as the signature shape; diamond checkerboard/tint patterns as
  brand surfaces.
- Action color: `#FF4654` (drop-in for legacy `#FE3554`).

## Consequences

- Supersedes improvement-plan §3.1 (visual identity) and its hexagon-avatar
  and Montserrat choices; the rest of §3 (layout, dark mode, accessibility,
  motion, OG cards) stands, re-tokened.
- Status-bar "shipped" segment becomes `#FFDC00` (no green in the MP palette).
- Cyan/yellow are fill-only colors; text-safe alternates are `#04AECA`,
  `#0071AC`, `#FE9144` (see accessibility notes in the design doc).
