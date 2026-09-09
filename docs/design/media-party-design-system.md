# Media Party design system — extracted spec

**Sources:** `Media Party 2023 · Style Guide.pdf` and `Media Party 2024 · Style Guide.pdf`
(single-page brand sheets, on Gino's Desktop; 2024 is the newer canonical guide).
**Decision:** the HackDash rewrite adopts this system (ADR 0002), superseding the
"evolve the legacy #FE3554 identity" direction in `docs/product/improvement-plan.md` §3.1.

---

## 1. Color

### Primary (2024)

| Token | Hex | Notes |
|---|---|---|
| `mp-cyan` | `#00D7FB` | Signature sky cyan |
| `mp-yellow` | `#FFDC00` | |
| `mp-red` | `#FF4654` | Action red (near-identical cousin of legacy HackDash `#FE3554`) |
| `mp-ink` | `#0B2A47` | Near-black navy — the brand's "black", used for text and dark grounds |

### Secondary (2024)

| Token | Hex | Notes |
|---|---|---|
| `mp-white` | `#FFFFFF` | |
| `mp-blue` | `#0071AC` | Deep blue |
| `mp-orange` | `#FE9144` | |
| `mp-teal` | `#04AECA` | Mid cyan-teal (darker, text-safe cousin of `mp-cyan`) |
| `mp-plum` | `#58253A` | Dark plum — appears in logo overlap blends |
| `mp-crimson` | `#D32633` | Deep red |

### 2023 differences (historical)

2023 primaries were cyan/yellow/red only; secondaries `#FE9144`, `#42729E`
(steel blue, replaced by `#0071AC` in 2024), `#0B2A47` (promoted to primary in
2024). Use the 2024 set.

### Usage observed in the guides

- Dark ground is **pure black** (`#000000`) in the logo-on-dark examples, with
  `mp-ink` reserved as the darkest palette color; either works as a dark surface,
  prefer `mp-ink` for UI so blacks stay warm.
- Overlaps blend multiply-style: cyan+blue, blue+red → plum, red+orange,
  orange+yellow. The plum and crimson secondaries are literally the blend
  products of the primaries — use them where two brand colors "meet".

## 2. Typography

- **One family: Poppins** (geometric sans; Google Fonts). The guides use no
  second face.
- Hierarchy demonstrated (the "Keynote speaker" specimen):
  - **Eyebrow/kicker:** Poppins Regular, sentence case ("Keynote speaker").
  - **Display:** Poppins Bold/SemiBold, large ("Media Party" / "Min Yoongi").
  - **Subtitle:** Poppins Light/Regular ("Rebooting journalism").
  - **Body:** Poppins Regular, small.
- **Wordmark style:** Poppins-like heavy uppercase with very wide
  letter-spacing (`MEDIA PARTY`); place/date lines beneath in bold caps with
  bullet separators (`OCT 5 • 6 • 7 • BUENOS AIRES`). Reusable as a label/
  eyebrow treatment: bold uppercase + ~0.25em tracking.

## 3. Logo system (template rules)

- **Construction:** a left-to-right morph of overlapping translucent shapes —
  two circles (cyan) transitioning into rotated rounded squares ("diamonds")
  in blue → red → orange → yellow, overlaps darkening (multiply). Wordmark
  centered beneath.
- **Variants:** light background (full color), dark background (full color on
  black), monochrome outline (line-art circles→diamonds + black wordmark).
- **Small sizes:** text-only (stacked `MEDIA / PARTY` or single-line
  `MEDIAPARTY`), or icon-only (a 2×2 cluster of 4 rotated rounded squares —
  red/orange/yellow/blue with plum center overlap — or its outline version).
- **Lockups (2024):** logo + place (`NEW YORK`, `BUENOS AIRES` in spaced caps
  under the wordmark) and `Media Party University` (wordmark + lighter-weight
  "University" line). Same three color treatments each.

## 4. Graphic elements (template)

1. **Diamond checkerboard pattern:** full-bleed grid of 45°-rotated rounded
   squares in the palette colors (red/blue/cyan/yellow/orange mix), edge-to-edge
   — used as hero/footer bands.
2. **Tint patterns:** the same diamond grid in near-monochrome tints (light
   cyan, light red, light yellow, light blue) with occasional dark-diamond
   accents — quiet section backgrounds.
3. **Photo cards:** black-and-white photography inside a rounded-square frame
   sitting on a solid palette-color rounded card (yellow, cyan, red observed).
   B&W treatment is part of the look — color comes from the frame, not the photo.
4. **Rounded-diamond motif:** the rotated rounded square (border-radius ≈ 22%
   of side, rotated 45°) is the atomic brand shape — bullets, avatars frames,
   pattern cells, icon.

## 5. Proposed mapping onto HackDash UI (to ratify)

- **Action/brand:** `mp-red #FF4654` — drop-in for legacy `#FE3554` (visually
  adjacent, so existing HackDash muscle memory survives).
- **Ink & dark surface:** `mp-ink #0B2A47` for headings/text and the dark-mode
  ground (projector wall mode).
- **Entity colors:** dashboard `mp-ink`, project `mp-blue #0071AC`,
  user `mp-plum #58253A`, collection `mp-teal #04AECA`,
  highlight/warning `mp-orange #FE9144`.
- **Status bar:** segments in `mp-red`; final "releasing" segment `mp-yellow`
  (the celebratory brand color — replaces the green "shipped" reward proposed
  earlier; MP palette has no green, and yellow is the party).
- **Type:** Poppins for headings AND body (replaces Montserrat + system stack);
  wide-tracked bold caps for eyebrows/labels per the wordmark treatment.
- **Shape language:** rounded-diamond replaces the hexagon as the avatar/
  signature shape (rotated rounded square via CSS, initials fallback on an
  entity color). Diamond tint patterns as hero/section backgrounds; the
  checkerboard band for landing hero and OG images.
- **Accessibility notes:** `mp-cyan` and `mp-yellow` fail contrast for text on
  white — text-safe alternates are `mp-teal`/`mp-blue` and `mp-orange`; cyan
  and yellow are for fills, patterns, and badges with ink text.

## 6. CSS tokens (ready to paste)

```css
:root {
  --mp-cyan: #00D7FB;
  --mp-yellow: #FFDC00;
  --mp-red: #FF4654;
  --mp-ink: #0B2A47;
  --mp-white: #FFFFFF;
  --mp-blue: #0071AC;
  --mp-orange: #FE9144;
  --mp-teal: #04AECA;
  --mp-plum: #58253A;
  --mp-crimson: #D32633;
}
/* Rounded-diamond motif */
.mp-diamond {
  border-radius: 22%;
  transform: rotate(45deg);
}
```
