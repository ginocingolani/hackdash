# HackDash Product & UX Improvement Plan

**Status:** proposed · **Date:** 2026-09-09 · **Author:** PM/UX pass over the legacy feature inventory (`docs/legacy/client.md` §3, items 1–48) informed by DoraHacks research.

**Phasing convention used throughout** (per ADR 0001: parity first, improvements after):

- **[P]** = parity-with-better-UX — same feature, rebuilt on the modern stack with the legacy bugs fixed and the interaction patterns updated. Allowed in phase 2.
- **[N]** = genuinely new scope — new data model fields, new endpoints, or new user-facing capabilities. Phase 3 only.

DoraHacks research sources: [dorahacks.io](https://dorahacks.io/), the [DoraHacks wiki](https://hellodorahacks.github.io/dorahacks-wiki/) (hackathon, BUIDL, organizer-guide pages), [how-to-create-a-hackathon guide](https://dorahacks.io/blog/guides/how-to-create-a-hackathon), [DIY hackathon guide](https://dorahacks.io/blog/guides/diy-your-hackathon), [judging blog](https://dorahacks.io/blog/judges/), and third-party comparisons ([hackathon.com platform guide](https://corporate.hackathon.com/articles/the-ultimate-guide-to-choosing-the-best-hackathon-website-2025-edition)).

---

## 1. Product positioning

**What HackDash is:** the lightweight, open-source dashboard for civic/media hackathons. One URL per event (`{domain}.hackdash.org`), a wall of projects, a six-stage progress bar per project, join/follow, and an embed you can drop into the event's own site. Historically the tool of Hacks/Hackers chapters, Media Party, and Latin American civic-tech communities — Spanish is effectively a first-class language (legacy es locale is *more* complete than en).

**Who uses it:**
- **Organizers** (event admins): create a dashboard in 30 seconds, project the wall on stage, export participants to CSV, curate a showcase for demos.
- **Participants**: post a project in under 2 minutes, recruit contributors, move a status bar as the weekend progresses.
- **Communities & press**: browse projects after the event; collections group recurring events (e.g., every Media Party) into a durable archive.

**How it differs from DoraHacks / Devpost — and must stay different:**

| | DoraHacks | Devpost | HackDash |
|---|---|---|---|
| Core object | Prize-funded hackathon with tracks, bounties, quadratic funding | Submission contest with eligibility rules and judging | **A living wall of projects** for a community event |
| Money | Central ($300M+ distributed, token voting, grants) | Central (sponsored prizes) | Absent by design |
| Weight | Heavy: registration, approval gates, judging backends, AI DevRel | Medium: forms, rules, judging | **Light: no gates; a project exists the moment someone types a title** |
| Post-event | Grant/milestone pipeline | Portfolio archive | Community memory: statuses, collections, embeds on partner sites |
| Ownership | Proprietary platform | Proprietary platform | Open source, self-hostable, subdomain-per-event |

**Positioning statement:** *HackDash is the fastest way to make a hackathon's work visible — during the event and after. It is to DoraHacks what a whiteboard is to a project-management suite.* Every proposal below is tested against that: we steal DoraHacks' **time-awareness, discovery IA, and project-page depth**, and we explicitly reject its **registration friction, token/quadratic voting, grants/bounty economy, and approval gates**.

**What we deliberately do NOT adopt from DoraHacks:**
- Crypto/token anything: quadratic funding, MACI voting, on-chain prize distribution, wallets. The non-crypto translation we keep is *lightweight community appreciation* (the existing Follow, §4.4 "community pick"), never weighted voting.
- BUIDL approval gates / private password-protected events as defaults. Openness is the product. (An `open` toggle already exists — item 14 — and stays a toggle, not a workflow.)
- Registration-before-participation. Logging in to create a project is the only gate we keep (item 1).
- AI auto-reply / automated DevRel. Out of scope for a volunteer-run OSS tool; revisit only if organizers ask.
- Bounties and milestone-tracked grants. Milestones translate to a non-monetary equivalent — the project **timeline/updates** (§2.3) — without any funding semantics.

---

## 2. Feature-by-feature modernization

Item numbers reference the parity checklist in `docs/legacy/client.md` §3.

### 2.1 Auth & identity (items 1–3)

| Item | Verdict | Plan |
|---|---|---|
| 1. OAuth login modal | **Modernize [P]** | Auth.js per ADR 0001. GitHub first-class + **email magic-link** as the zero-friction path (civic/media participants often have no GitHub; Twitter/Meetup OAuth are dead as configured). Login is a dedicated `/login` page *and* an inline sheet triggered contextually ("Log in to join this project") preserving `?redirect=` — but validate the redirect against same-origin to kill the legacy open-redirect (`server.md` §4). |
| 2. Logout | **Keep [P]** | Standard Auth.js signout; keep `/logout` URL as redirect for old links. |
| 3. Forced profile completion | **Modernize [P]** | Replace the buggy hard redirect (`checkProfile` missing-return bug #5) with a non-blocking banner + a required-fields step only when the user first *creates* something. Email becomes genuinely optional for browsing; account linking (one human, many providers) fixes legacy's duplicate-User problem — needs an `accounts` collection, so the linking part is **[N]** data-model work scheduled with the auth migration. |

### 2.2 Landing / discovery (items 4–8)

| Item | Verdict | Plan |
|---|---|---|
| 4. Create-a-dashboard hero | **Keep, loosen [P]** | The 30-second create flow is the soul of the product — keep the single-field hero. Relax the regex to `/^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$/` (legacy 5–10 chars can't fit "mediaparty26"); keep legacy slugs valid. Inline availability check (debounced) replaces the post-submit `subdomain_inuse` error. **Add a DB unique index** (fixes bug #11). |
| 5. Four browse tabs as carousels | **Modernize: kill the carousels [P]** | Carousels hide content and are hostile on mobile (legacy needed 5 breakpoint configs). Replace with **one discovery page with filter pills** (Dashboards / Projects / People / Collections) and a responsive card grid + "load more". Deep links (`/dashboards`, `/projects`, …) preserved as pre-filtered views. This is DoraHacks' strongest IA lesson: their listing pages are grids segmented by state, not carousels. |
| 6. Server-side search per tab | **Keep [P]** | URL-synced `?q=`, debounced, but rendered server-side (RSC) so search results are shareable and indexable. Replace regex-over-fields with a MongoDB text index (also removes the `$where` predicates that break on Atlas — `server.md` §10). |
| 7. Global stat counters | **Keep [P]** | Fun and harmless. Compute from aggregates on demand (cache 5 min) instead of the metrics cron; decide deliberately what `/counts` exposes (fixes leak bug #8). |
| 8. Team strip / partner logos / about | **Modernize [P]** | Move team + partners from hardcoded arrays/`config.team` to a CMS-ish `site.json` in repo. Rewrite the about block as translatable markdown (legacy embeds raw HTML in i18n strings). |
| — Discovery by state | **New [N]** | Once dashboards have dates (§4), the landing's default sort becomes **Live now → Upcoming → Recent** with state badges — the single highest-impact discovery change, lifted straight from DoraHacks' hackathon listing. |

### 2.3 Dashboards (items 9–19)

| Item | Verdict | Plan |
|---|---|---|
| 9. Dashboard page | **Modernize [P]** | Keep title/description/link + admin avatars + project grid, but swap masonry-of-200px-squares for a **responsive CSS-grid of uniform project cards** (cover, title, status bar, contributor count). Masonry with fixed cells was a 2013 constraint; uniform cards scan faster on a projector and reflow on phones. Server-rendered (kills the prerender service). |
| 10. In-dashboard search | **Keep [P]** | Client-side filter over the already-loaded list, URL-synced. Fine as-is. |
| 11. Sorting | **Keep [P]** | name / date / showcase; add "recently active" once project `updated_at` exists (trivial schema add, do it in parity). |
| 12. Inline editing | **Modernize [P]** | Replace X-editable spans with an explicit **admin edit mode** (pencil → side panel form with markdown preview). Inline click-to-edit is undiscoverable and screen-reader hostile. |
| 13. Add admins, no revoke | **Fix [P]** | Typeahead stays; **add revoke** (new `DELETE /admins/:uid` endpoint — counts as parity because its absence is listed as bug #12). Guard: can't remove the last admin. |
| 14. Open/close toggle | **Keep [P]** | Becomes partially derived from the schedule in §4 (auto-close at submission deadline, admin can override). |
| 15. Showcase mode | **Keep [P]** | Drag-and-drop reorder + visibility switches (dnd-kit, keyboard-accessible). This is HackDash's demo-day superpower; DoraHacks has nothing this direct. Rename user-facing label to "Demo order". |
| 16. CSV export | **Keep, fix [P]** | Fix bug #3 (followers column duplicated contributors). Add a projects CSV alongside the members CSV. |
| 17. Share popover | **Modernize [P]** | Drop Google+ (defunct) and per-network SDKs. **Copy link + native Web Share API + X/LinkedIn/WhatsApp/Telegram intents** (WhatsApp/Telegram matter for the LatAm civic community far more than Facebook). Keep `/d/:domain` short URLs (item 42). |
| 18. Embed builder | **Keep [P]** | A genuine differentiator (media orgs embed the wall in liveblogs). Rebuild with same params (§2.6) and live preview; render hide-flags server-side instead of deleting DOM nodes post-render (client bug list). |
| 19. Delete dashboard | **Keep, fix [P]** | Fix the never-firing multi-admin guard (bug #2). Move to dashboard settings (not just profile); require typing the domain to confirm. |
| — Dashboard "About" tab | **New [N]** | Optional rich content area (schedule, venue, rules, sponsors) as markdown sections — DoraHacks' "Details" section, minus the heavy editor. See §4. |

### 2.4 Projects (items 20–32)

| Item | Verdict | Plan |
|---|---|---|
| 20–21. Create/edit | **Modernize [P]** | One form, two fields required (title, description) — preserve the 2-minute promise. Everything else (cover, link, tags, status) editable after creation from the project page. Autosave drafts to localStorage. |
| 22. GitHub import | **Keep [P]** | Prefill title/description/link from a repo URL; server-proxy the GitHub call (unauthenticated client calls rate-limit at events where 200 people share a NAT). |
| 23. Cover upload | **Modernize [P]** | Unify the 0.5 MB/3 MB client/server mismatch at 5 MB, resize server-side to standard renditions, store on S3-compatible storage (legacy wrote to `public/uploads/` and never cleaned up). **Auto-generate a branded gradient cover from the project title** when none uploaded — removes the legacy "no cover → invisible in landing search" trap (server filters projects by cover presence). |
| 24. 6-stage status bar | **Keep — it's the brand [P]** | The status progress bar is HackDash's most distinctive UI element; DoraHacks has no equivalent for in-event progress. Canonical order = server's (`brainstorming, wireframing, building, researching, prototyping, releasing`), single-sourced in `packages/db` (fixes the client/server disagreement). Make it a tappable segmented control for the team, read-only bar for everyone else. |
| 25. Tags | **Keep [P]** | Token input; chips link to filtered discovery. Normalize to lowercase, cap 10. |
| 26. Markdown description | **Keep [P]** | Render sanitized markdown; edit with a plain textarea + preview toggle (no WYSIWYG). |
| 27–28. Join/Leave, Follow | **Keep, fix [P]** | Fix the leader-leave guard (bug #4). Rename Follow's UI verb to "Cheer"? **No — keep Follow**; renaming breaks user memory for zero gain. |
| 29. Delete | **Keep [P]** | Confirm dialog; leader or admin. |
| 30. Detail page | **Modernize [P]** | Restructure as: header (cover, title, status bar, actions) → description → **team section with roles** (leader badge, contributors) → links (demo, repo) → followers. Guard the null-leader crash (client bug list). |
| 31. Comments (Discourse/Disqus) | **Drop both; replace [N]** | Disqus is ad-ridden and privacy-hostile; the Discourse bridge required running Discourse. Ship parity **without comments** (they're per-deployment flags today, effectively off), then add **native lightweight comments** (flat, markdown, delete-by-author/admin) as new scope. DoraHacks' per-hackathon discussion forums confirm demand, but a full forum is over-scope. |
| 32. Per-project embed | **Keep [P]** | Same treatment as item 18. |
| — Project updates timeline | **New [N]** | Short timestamped posts on a project ("shipped the scraper 🎉"). This is DoraHacks' BUIDL *milestones* translated to a non-funding context, and it's what makes projects feel alive during a 48-hour event. Feeds the live wall (§4.4). |
| — "Looking for teammates" flag | **New [N]** | A boolean + free-text "roles needed" on a project, surfaced as a filter on the dashboard ("3 teams need people"). DoraHacks' 'Need Teammates' option, minus the registration apparatus. Cheapest possible team-formation feature; fits the model perfectly. |

### 2.5 Collections (items 33–35)

| Item | Verdict | Plan |
|---|---|---|
| 33. Collection page | **Keep [P]** | Details + grid of dashboard cards (same card component as landing). |
| 34. Inline editing | **Modernize [P]** | Same edit-panel pattern as dashboards. |
| 35. Regressed create/manage UI | **Restore [P]** | Explicitly on the parity list: the entire collections *write* path is broken client (dead code) and server (bug #1). Rebuild: create collection from profile; "Add to collection" action on any dashboard card (owner's collections in a popover). Collections are HackDash's institutional-memory feature — "Media Party 2013–2026" as one URL — and no competitor has an equivalent this simple. |

### 2.6 Embeds & sharing (items 40–42)

| Item | Verdict | Plan |
|---|---|---|
| 40–41. Iframe embeds | **Keep, compat-guaranteed [P]** | ADR 0001 requires a compatibility story: honor the exact legacy params (`hide=`, `query`, `status`, `sort`, `slider=1..6`) at the same `/embed/*` URLs so existing partner-site iframes keep working the day hackdash.org switches. Render server-side, no client bundle beyond a resize script; `slider` maps to grid column count. |
| 42. Short URLs | **Keep [P]** | `/p/:pid`, `/d/:domain` redirects, plus proper OG images (see §3.4 — generated OG cards replace the static `logohack.png`). |
| — oEmbed / copy-as-image | **New [N]** | oEmbed endpoint so pasting a HackDash link into Discourse/Notion/Slack unfurls the live card. Low effort, high distribution value for media orgs. |

### 2.7 Profiles (items 36–39)

| Item | Verdict | Plan |
|---|---|---|
| 36–37. Public profile / own editing | **Keep, fix [P]** | Fix bug #9 (`PUT /profiles/:uid` writing to `req.user`). Email visible only to self (tighten legacy's "any authenticated requester" leak — do it in parity; it's a privacy fix, not a feature). |
| 38. Tabbed counts | **Keep [P]** | Collections / Dashboards / Projects / Contributions / Following — same aggregate, rendered as tabs with count badges. |
| 39. Guarded dashboard removal | **Keep [P]** | Folded into item 19's fixed flow. |
| — Participation history | **New [N]** | Once dashboards have dates, the profile gains a reverse-chronological "hackathons" timeline — a lightweight civic-tech résumé, the non-crypto analog of DoraHacks' hacker profile ("proof of participation" without tokens or badges-as-NFTs). |

### 2.8 Non-SPA pages & platform (items 43–48)

| Item | Verdict | Plan |
|---|---|---|
| 43. Live feed | **Restore [P→N]** | The bus event vocabulary (`project_created/edited/join/leave/follow`) is the spec. Parity ships the **per-dashboard activity feed page** over SSE (per ADR) — it was always intended (`/live` view exists, unrouted) and it's the projector view organizers actually want. Strip emails from payloads (bug #10). The full-screen auto-rotating "wall mode" is **[N]** polish (§4.4). |
| 44. Metrics page + `/counts` | **Modernize [P]** | Replace cron-written JSON (whose config absence crashes boot!) with an on-demand aggregate endpoint + a simple admin stats page. Keep `?q=<code>` gating or move behind admin auth. |
| 45. `/install` | **Drop** | Broken beyond repair; replace with a documented seed script (`pnpm db:seed --admin <email>`). Not user-facing. |
| 46. 404/500 | **Keep [P]** | Next.js error pages, branded, bilingual. |
| 47. Prerender/sitemap/OG | **Replace [P]** | SSR makes prerender obsolete (per ADR); sitemap becomes an on-demand route; OG metas per entity with generated images (§3.4). |
| 48. GA | **Replace [P]** | Classic `_gaq` is long dead. Self-hostable, cookieless analytics (Plausible/Umami) — the right default for a civic OSS tool; event vocabulary preserved (HomeSearch, DashSearch, Join/Leave/Follow). |
| i18n (client.md §5) | **Modernize [P]** | next-intl with en + es + pt at launch (port the 131 es keys; fresh Brazilian Portuguese translation — added by Gino 2026-09-09), a visible language switcher (legacy had none), persisted preference. Spanish parity is a launch gate, not a nice-to-have. |

---

## 3. UX/UI direction

### 3.1 Visual identity: evolve, don't rebrand

The legacy tokens are a real, recognizable identity — keep the DNA, modernize the execution:

- **Brand `#FE3554` stays** as the single action color, now expressed as a token scale (`brand-50…950`) so it works for focus rings, subtle backgrounds, and a dark mode. On dark surfaces use a lightened `#FF5C77` for AA contrast on text/icons.
- **Entity colors become semantic tokens**, not decoration: dashboard `#353D45`, project `#00A1CA`, user `#515D8A`, collection `#02B387`, contributions `#7480AD`. Use them *only* where they carry meaning — entity badges on mixed search results, tab pills on discovery, count chips on profiles — never as arbitrary section theming. Each gets an adjusted dark-mode counterpart tuned for 4.5:1 on text.
- **Typography:** keep **Montserrat** for headings (it *is* the HackDash look) but drop Oswald — two display sans faces is one too many, and condensed Oswald reads dated. Body switches from 14px Montserrat to **16px Inter/system stack** for legibility and CJK/diacritic coverage (Spanish!). Type scale: 32/24/20/16/14 with a 1.5 line height.
- **Hexagon avatars stay — as the signature.** Modern execution: CSS `clip-path` (the legacy mixin's spiritual successor), consistent 40px inline / 64px cards / 96px profile sizes, and a deterministic two-letter-initials fallback on an entity-color background (kills the defunct `avatars.io` dependency). Hexagons apply to *people only*; dashboards/projects get rounded-rect covers so the hexagon keeps its meaning.
- **Status bar as brand element:** the 6-segment progress bar gets one canonical component (filled segments in brand red → final "releasing" segment in collection-green `#02B387` as a small "shipped" reward), identical at card size, detail size, and embed size.

### 3.2 Layout system for 2026

- **Responsive, mobile-first.** Legacy was desktop-carousel-first. New grid: 1 column <640, 2 <1024, 3 <1440, 4 above. The dashboard wall is the same page on a phone at the venue and on the projector — no separate mobile layout, just container queries on the cards.
- **Dark mode** via `prefers-color-scheme` + explicit toggle (three-state). Non-negotiable for the projector case: a **dark dashboard wall looks dramatically better on stage**. Tailwind semantic tokens (`bg-surface`, `text-primary`, etc.) from day one — retrofitting is 10× the cost.
- **Accessibility as parity criterion:** every legacy interaction that was mouse-only (X-editable, drag-and-drop showcase, carousels) is rebuilt keyboard-first: visible focus rings (brand color), dnd-kit keyboard reorder for showcase, no information conveyed by color alone (status segments get labels on hover/focus and a text stage name beside the bar). Target WCAG 2.2 AA; audit with axe in Playwright e2e.
- **Motion:** micro only — status-segment fill, card hover lift, live-feed item slide-in. `prefers-reduced-motion` respected. No page transitions.

### 3.3 Key screens, concretely

1. **Landing:** full-bleed hero on `#353D45` (dashboard dark) with the one-field create form and live availability check; beneath it, the discovery grid opening on **Live now** (state-badged cards), then Upcoming, then a "from the community" recent-projects row. Stat counters as a quiet single line, not a billboard.
2. **Dashboard wall:** sticky compact header (hex-avatar admin cluster, title, state badge + countdown once §4 lands, Search, Sort, "+ New project" in brand red). Below, the uniform card grid. Admin sees a slim toolbar (Edit · Showcase · Export · Embed · Settings). At `?tv=1` (**[N]**): chromeless dark wall for projectors.
3. **Project page:** cover (or generated gradient) as a banner, title + status bar overlaid on a scrim; two-column below (description md left; team/links/tags right, stacking on mobile). Primary action swaps by relationship: Join → Leave / Edit (team) / Follow (visitor).
4. **Project create:** modal-free, single page, two fields + "Import from GitHub"; the form submits in one tap and lands you on your project page with a "add a cover / invite teammates" checklist. Speed is the feature.
5. **Profile:** hex avatar 96px, bio, provider links; entity-colored tab pills with counts; content as the same card grid.
6. **Embed:** headless variant of the wall/card components — one component tree, `hide` flags as props, no post-render DOM surgery.

### 3.4 Social cards

Generated OG images per entity (`@vercel/og`-style): dashboard = title + project count + status-color strip + state badge; project = cover + title + status bar. Replaces the one static `logohack.png` for everything and makes shares in Slack/WhatsApp/X actually legible. **[P]** — it replaces the prerender/meta system we must rebuild anyway.

---

## 4. Hackathon lifecycle (the DoraHacks gap)

Legacy dashboards are timeless: nothing distinguishes an event happening *right now* from one that ended in 2014. DoraHacks' entire IA hangs on event state (upcoming/ongoing/ended sections, deadlines, timelines). We adopt the time-awareness **without** adopting registration, approval, or judging machinery — and without breaking "a dashboard is just a wall you can always write on."

### 4.1 Data model: three optional dates **[N]**

Add to Dashboard: `starts_at`, `ends_at`, `submissions_close_at` (all optional, tz-aware). That's the entire schema change.

- **All null → "evergreen" dashboard**, behaves exactly like legacy. No migration pain: every existing dashboard is evergreen. The mental model survives because dates are additive, not required.
- Derived (never stored) state: `upcoming` (now < starts_at) → `live` (between) → `ended` (now > ends_at). Evergreen dashboards simply have no state badge.

### 4.2 What each state changes (deliberately little)

- **Upcoming:** wall shows a countdown + description/schedule; "Create project" available unless admin closes it (pre-event brainstorming is a real Media Party pattern — don't block it).
- **Live:** "LIVE" badge everywhere the dashboard appears; countdown flips to "submissions close in 3h 12m" when `submissions_close_at` approaches; activity feed prominent.
- **Submissions closed:** dashboard auto-sets `open=false` (reusing item 14's existing mechanism — the deadline is just a scheduled version of the toggle admins already understand). Editing existing projects stays allowed by default (statuses keep moving through demos); admin can freeze edits too.
- **Ended:** wall becomes archive-toned (state badge, "happened March 2026"), showcase order becomes the default sort, "Create project" hidden. Nothing is deleted, locked, or paywalled.

### 4.3 Schedule block **[N]**

Optional "Schedule" markdown section (or a simple list of `{time, title}` rows) on the dashboard About tab, rendered in the event's timezone with a "your time" toggle. Explicitly *not* a session/agenda product — one screen, no RSVPs.

### 4.4 What replaces judging/voting

No judges, no scores, no token votes. The non-crypto translations:

- **Showcase (item 15)** is the organizer's "winners" mechanism — it already exists; give it optional labels per entry ("Jury favorite", "Audience pick") as free text. **[N]**, tiny.
- **Follow counts** surface as a "community favorites" sort option during/after the event — 1-person-1-follow, visible, gameable-but-who-cares. **[P]** (it's just a sort on existing data).
- **Wall mode** (`?tv=1`) cycling showcase projects + live activity feed = demo-day ceremony support. **[N]**.

### 4.5 Notifications **[N]**, minimal

DoraHacks runs full comms infrastructure; we ship exactly two email triggers (resurrecting the intent of the dead `lib/mailer`): (a) someone joined your project (the one template legacy actually wrote), (b) submissions close in 24h, to project members of a dated dashboard. Digest-style, unsubscribable, nothing real-time. Everything else stays in the activity feed.

---

## 5. Prioritized roadmap

### P0 — Parity with fixes (phase 2 gate; all [P])

1. Auth.js with GitHub + magic-link email, safe `?redirect=`, account model ready for linking — legacy providers are dead; email login unblocks non-developers. *(items 1–3)*
2. Landing + discovery grid with URL-synced search, no carousels — same routes, modern IA, mobile works. *(4–8)*
3. Dashboard wall: responsive card grid, edit panel, admin add **and revoke**, open/close, delete with working guards — core product + bug #2/#12. *(9–14, 19)*
4. Projects end-to-end: 2-field create, GitHub import, covers with generated fallback, canonical status order single-sourced, tags, markdown, join/leave/follow with fixed guards, delete. *(20–30 minus 31)*
5. Showcase mode with keyboard-accessible drag reorder — demo-day differentiator, must not regress. *(15)*
6. Collections restored end-to-end (create/edit/add-remove dashboards) — regressed feature explicitly targeted by the legacy docs. *(33–35, bug #1)*
7. Embeds at legacy URLs honoring legacy params, server-rendered — ADR-mandated compatibility for partner sites. *(18, 32, 40–41)*
8. Profiles with fixed self-update and email privacy; CSV export with fixed columns. *(16, 36–39, bugs #3/#9)*
9. SSR SEO: OG metas + generated share images, on-demand sitemap, 404/500, short URLs — replaces prerender/sitemap services. *(42, 46–47)*
10. en/es/pt i18n with switcher; cookieless analytics; per-dashboard activity feed over SSE (emails stripped) — Spanish community is core; feed page was always intended. *(43, 48, §5 i18n)*

### P1 — High-impact modernization (early phase 3; [N] unless noted)

11. **Lifecycle dates** (`starts_at`/`ends_at`/`submissions_close_at`) + state badges + countdowns + deadline auto-close — the single biggest gap vs DoraHacks, at the cost of three optional fields.
12. State-aware discovery (Live now / Upcoming / Recent on landing) — makes hackdash.org feel alive the moment dates exist.
13. Dark mode + `?tv=1` wall mode — the projector is a first-class client; organizers see it every event.
14. Project updates timeline — DoraHacks milestones without money; keeps walls alive during the 48 hours.
15. "Looking for teammates" flag + roles text + dashboard filter — cheapest possible team formation, straight fit for the model.
16. Two-trigger email notifications (join, deadline-24h) — resurrects the mailer's documented intent, nothing more.

### P2 — New-era features (later phase 3; all [N])

17. Native lightweight comments on projects — replaces Disqus/Discourse without running a forum. *(31)*
18. Showcase labels ("Jury favorite") + community-favorites sort — ceremony support with zero voting infrastructure.
19. Schedule block with timezone rendering — one-screen agenda, not an events product.
20. Profile participation history — the civic-tech résumé, unlocked for free by lifecycle dates.
21. oEmbed endpoint — link unfurls in Slack/Notion/Discourse for media-org distribution.
22. Account linking migration UI for legacy Twitter/Meetup/Facebook users — closes the auth migration story from ADR 0001.

**Explicitly rejected** (revisit only with organizer demand): registration/approval gates, judging backends and scoring, quadratic/token voting, bounties/grants/prize distribution, AI auto-reply, private password-protected dashboards, native mobile apps.
