# Legacy client-side map (Backbone/Marionette SPA)

Map of the original HackDash client (in-tree under `legacy/client/`). Two
browserify bundles from one tree: `hackdashApp.js` (main) and `embedApp.js`
(embed), Handlebars templates compiled via `hbsfy`, Marionette views, Bootstrap 3
(custom build, brand color `#FE3554`), LESS compiled at runtime by the server.

## 1. Bootstrap

Server-rendered Jade shells inject `window.hackdash = {subdomain, baseURL,
discourseUrl, disqus_shortname, statuses, providers, fbAppId, user}` and call
`startApp()`. `Initializer.js` hardcodes `apiURL = "/api/v2"`, sets up i18n from
`navigator.languages`, GA (classic `_gaq`), the FB SDK (v2.3) when configured —
and **overwrites the server-provided statuses with its own list in a different
order** (`brainstorming, researching, prototyping, wireframing, building,
releasing` vs the server's `brainstorming, wireframing, building, researching,
prototyping, releasing`). Page state lives on a mutable global `hackdash.app`
(`type`, `dashboard`, `projects`, `project`, `collection`, `profile`,
`previousURL`) — the de-facto store the rewrite replaces with real state.

## 2. Route/page inventory

Main router (pushState):

| Route | Page |
|---|---|
| `/` and `/login` | Landing (Home layout) |
| `/dashboards` `/projects` `/users` `/collections` | Landing with that tab active; server-side search `?q=` |
| `/dashboards/:domain` | Dashboard page (dashboard + admins + projects, showcase support) |
| `/dashboards/:domain/create` | Project create form |
| `/projects/:pid` | Project detail |
| `/projects/:pid/edit` | Project edit form |
| `/collections/:cid` | Collection page |
| `/users/profile` | Own profile (edit) |
| `/users/:id` | Public profile |

Embed router: `/embed/dashboards/:domain`, `/embed/projects/:pid`.
Server-side extras to preserve: `/p/:pid` → `/projects/:pid`, `/d/:domain` →
`/dashboards/:domain`, `/logout`, subdomain `{dash}.host` → `/dashboards/:dash`.

## 3. Feature inventory (the parity checklist)

**Auth & identity**
1. OAuth login modal (providers server-driven from `keys.json`), `?redirect=` back.
2. Logout.
3. Forced profile completion when email missing.

**Landing / discovery**
4. Create-a-dashboard hero form (regex `/^[a-z0-9]{5,10}$/`, login-gated, `subdomain_inuse` error).
5. Four browse tabs (Collections / Dashboards / Projects / People) as carousels, deep-linkable.
6. Server-side search per tab (`?q=`, debounced 300 ms, URL-synced).
7. Global stat counters (from `GET /counts`).
8. Team strip (`/api/v2/users/team`), partner logos (hardcoded), about block, mobile menu.

**Dashboards**
9. Dashboard page: title/description/link, admin avatars, masonry project grid.
10. Client-side project search within a dashboard (`?q=`).
11. Sorting: name / date / showcase (`?sort=`).
12. Inline editing (X-editable) of title/description/link — admins only.
13. Add admins via user typeahead (min 3 chars). No revoke UI (API has none either).
14. Open/close dashboard toggle (closed hides Create Project).
15. Showcase mode: drag-and-drop reorder + per-project visibility switches → ordered `showcase[]`.
16. CSV export (admins).
17. Share popover: Twitter / Facebook / LinkedIn / Google+ (defunct) / embed.
18. Embed builder modal: live iframe preview, hide toggles, slider 1–6, keyword + status filter with counts, sort, copyable snippet.
19. Delete dashboard from profile (guards: admin, sole owner, zero projects).

**Projects**
20. Create under a dashboard. 21. Edit (leader or admin).
22. GitHub import (unauthenticated `api.github.com/repos/{user}/{repo}` prefill).
23. Cover upload via Dropzone (client cap 0.5 MB vs server 3 MB, jpg/png/gif).
24. 6-stage status lifecycle rendered as a progress bar everywhere.
25. Tags (select2 tokens); tag chips link to global search.
26. Markdown description. 27. Join/Leave (contributors). 28. Follow/Unfollow.
29. Delete (confirm; leader or admin). 30. Detail page with leader/contributor/follower avatars, demo link.
31. Comments via Discourse and/or Disqus (per-deployment flags).
32. Per-project embed builder.

**Collections**
33. Collection page: details + masonry grid of dashboards.
34. Inline editing (owner).
35. **Regressed**: create-collection and add/remove-dashboard UI is dead code
    (`Collection/List.js` never required) — API endpoints exist (though broken
    server-side too). The rewrite should restore this feature.

**Profiles**
36. Public profile (email hidden from anonymous). 37. Own profile editing.
38. Tabs with counts: Collections, Dashboards, Projects, Contributions, Following.
39. Guarded dashboard removal.

**Embeds & sharing**
40. Dashboard iframe embed: `?hide=title,desc,logo,pprg,ptitle,pcontrib,pacnbar`
    + `query`/`status`/`sort`/`slider=1..6`.
41. Project iframe embed: `?hide=prg,pic,title,desc,contrib,acnbar`.
42. Social sharing using short URLs `/d/:domain`, `/p/:id`.

**Non-SPA pages**
43. Live feed page — unreachable (no route renders it) but the socket server and
    bus events still run; easy win to restore.
44. Metrics page (`/metrics` + Chart.js) and `/counts`.
45. `/install` admin bootstrap (broken). 46. 404/500 pages.
47. Prerender/sitemap/OG metas. 48. GA pageviews + events (HomeSearch, DashSearch, Join/Leave/Follow/Unfollow).

## 4. Client models → API mapping

All against `/api/v2` except `Counts` (`GET /counts`). `Dashboard` uses
`idAttribute: "domain"`. `Projects.parse` marks showcase-active projects;
client-side `search()` is a regex over title/description/tags; sorts by
title/created_at/showcase. `Collections.parse` **whitelists collections with a
title and ≥1 dashboard**. Backbone `patch` is globally rewritten to HTTP `PUT`
(the server has no PATCH).

## 5. i18n

Custom micro-i18n, positional `{1}` substitution, English fallback. Languages:
**en (129 keys) and es (131 keys), Spanish effectively complete.** Language from
browser only — no switcher, no persistence. Some strings embed raw HTML
(notably the long "The HackDash was born" about block).

## 6. Design tokens (from `settings.less`)

Brand action `#FE3554`; entity colors — dashboard `#353D45`, project `#00A1CA`,
user `#515D8A`, collection `#02B387`, contributions `#7480AD`, likes `#B39D02`.
Fonts Montserrat (primary) + Oswald (secondary), 14 px base. Hexagonal avatar
clip (CSS mixin). Masonry cells 200×200/gutter 5; carousel breakpoints
1450/1200/1024/750/430.

## 7. Dead code & client bugs (do not reproduce)

- Dead: activity-feed views (`Home/Feed*`), "My Collections" modal
  (`Collection/List*`, Bootstrap-2 markup), embed header, most of
  `public/js/libs/*`, root `embed/` JSONP widget (no `.jsonp` route exists
  server-side; only iframe embeds are real).
- Client/server statuses arrays disagree in order (see §1) — unify to the
  server's order as canonical.
- Avatar fallback hits defunct `avatars.io`.
- Success detected via `err.responseText === "OK"` inside error handlers
  (Profile/Project edit).
- Unguarded `leader._id` dereference in project cards; shared mutable
  `defaults` collections on `Profile`; optimistic add/remove-dashboard with no
  failure handling.
- Header search only mounts on dashboard pages.
- Embed "hide" implemented by deleting DOM nodes post-render.
- Duplicated domain regex and status list client/server — single-source these.
