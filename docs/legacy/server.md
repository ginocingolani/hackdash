# Legacy server-side map

Map of the original HackDash server (preserved in-tree under `legacy/`). This is
the spec for the rewrite. Version `0.10.1`, Express 4.12 + Mongoose 5.8 + Jade +
Backbone SPA. Source mixes ES2015 (transpiled at runtime via `babel/register`,
Babel 5) and ES5 CommonJS; bare imports like `lib/models` resolve via `NODE_PATH=.`.

---

## 1. Boot & config

`legacy/index.js`: registers babel, loads `lib/server` (Express app), listens on
`process.env.PORT || 3000` (`config.port` is **not** the listen port — it only
builds view URLs). If `config.live` is truthy, attaches socket.io via `lib/live`.

`legacy/lib/server/index.js` middleware order: less-middleware over `public/` →
favicon → morgan → compression → body-parser → method-override → conditional
`seo(app)` when `config.prerender.enabled` → `subdomain offset` from dots in
`config.host` (crashes at boot if host has no dot; sample uses `local.host`) →
express-session with connect-mongo (secret `config.session`, cookie 7 days,
domain `.{config.host}` so subdomain dashboards share sessions) → passport →
static `public/` (1-year maxAge) → `lib/auth` → `lib/routes` → 404/500 handlers.
In production, `uncaughtException` is swallowed with a `console.log`.

`config/index.js` imports **both** `config.json` and `config.test.json`
unconditionally — both gitignored files must exist to boot in any environment.

Config keys actually read: `db.{url,host,name}`, `host`, `port`, `session`,
`title`, `live`, `mailer`, `team` (user ids for `/api/v2/users/team`),
`maxQueryLimit` (fallback 50), `googleAnalytics`, `facebookAppId`,
`discourseUrl`, `disqus_shortname`, `prerender.{enabled,db}`.

Separate gitignored configs with samples: `metrics/config.json`,
`sitemap/config.json`, `prerender/config.json`, `embed/config.json`.
**`lib/routes/metrics/controllers.js` imports `metrics/config` at boot — its
absence prevents the whole server from starting.**

`keys.json` (gitignored, sample at `keys.json.sample`) is the single source of
truth for auth providers: its top-level keys (twitter, meetup, facebook, github)
drive both Passport strategy registration and the login buttons.

## 2. Data model

Schemas in `legacy/lib/models/*.js` are plain objects wrapped in `new Schema()`
by `index.js`. Models: `User`, `Project`, `Dashboard`, `Collection`
(collections `users`, `projects`, `dashboards`, `collections`). **No plugins,
virtuals, methods, statics, hooks, or explicit indexes anywhere** — behavior
lives in route controllers. Only implicit `_id` indexes exist.

### User
| Field | Type | Notes |
|---|---|---|
| `provider` | String, required | `twitter\|facebook\|github\|meetup` |
| `provider_id` | Number, required | typed Number but GitHub/Facebook ids are strings |
| `username` | String, required | |
| `name` | String, required | |
| `email` | String | regex `/.+@.+\..+/`; absence forces redirect to `/users/profile` |
| `picture` | String | avatar URL, often protocol-relative `//…` |
| `admin_in` | [String], default `[]` | **dashboard `domain` strings — the entire authorization model** |
| `bio` | String | non-empty bio gates listing in landing "people" |
| `created_at` | Date, default now | |

Privacy mask used on most populates: `-__v -email -provider_id`.

### Project
| Field | Type | Notes |
|---|---|---|
| `title` | String, required | |
| `domain` | String | **denormalized dashboard domain — string join, not a ref** |
| `description` | String, required | |
| `leader` | ObjectId→User, required | |
| `status` | String enum, default `brainstorming` | statuses: `brainstorming, wireframing, building, researching, prototyping, releasing` |
| `contributors` | [ObjectId→User] | creator added on create |
| `followers` | [ObjectId→User] | creator added on create |
| `cover` | String | presence gates landing listing |
| `link` | String | auto-prefixed `http://` |
| `tags` | [String] | accepts comma-separated string |
| `created_at` | Date, default now | |

### Dashboard
| Field | Type | Notes |
|---|---|---|
| `domain` | String | slug/subdomain, regex `/^[a-z0-9]{5,10}$/`. **Not unique at DB level** — only a racy `findOne` check |
| `title`, `description`, `link` | String | `link` auto-prefixed |
| `open` | Boolean, default true | false blocks project creation |
| `showcase` | [String] | featured project ids |
| `owner` | ObjectId→User | not required (legacy dashboards may lack it) |
| `covers` | [String] | **denormalized** member-project covers |
| `projectsCount` | Number | **denormalized** count |
| `created_at` | Date, default now | |

`covers`/`projectsCount` recomputed on every project create/delete/cover change.

### Collection
`owner` (ObjectId→User, required), `title`, `description`,
`dashboards` [ObjectId→Dashboard] (true refs), `created_at`.

Ref graph: Project.{leader,contributors,followers}→User;
Project.domain→Dashboard.domain (string); Dashboard.owner→User;
User.admin_in[]→Dashboard.domain; Collection.owner→User;
Collection.dashboards[]→Dashboard.

## 3. HTTP API (`/api/v2`)

Auth helpers: `isAuth` → 401; `notAllowed` → 405. Public GETs use wide-open `cors()`.

### Dashboards
| Method | Path | Auth | Behavior |
|---|---|---|---|
| POST | `/dashboards` | session | validates domain regex (else 500 `subdomain_invalid`), 409 `subdomain_inuse`; creates `{domain, owner}`, pushes domain into creator's `admin_in` |
| GET | `/dashboards` | public | search: `q`, `limit` (capped `maxQueryLimit`), `page`. No `q` → landing filter `projectsCount>1 AND covers non-empty` (uses `$where`). With `q` → regex over domain/title/description. Sort `created_at desc` |
| GET | `/dashboards/:domain` | public | populates owner `_id name picture bio`; 404 if missing |
| GET | `/` (subdomain) | public | same, domain from `req.subdomains[0]` |
| GET | `/dashboards/:domain/csv` | admin_in | CSV of members. **Bug: iterates contributors twice; followers never exported** |
| PUT | `/dashboards/:domain` | admin_in (403) | updates `title, description, link, open, showcase` only; domain/owner immutable |
| DELETE | `/dashboards/:domain` | owner | refuses if projects exist; multi-admin guard **broken** (`User.count` without await always passes); pulls domain from all `admin_in`; 204 |

### Projects
| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/:domain/projects` | public | dashboard's projects (unlimited when domain filter present) |
| GET | `/projects` | public | search `q`/`limit`; no filters → only projects with cover; regex over title/description/tags/domain |
| POST | `/projects` | session | dashboard must exist (404) and be `open` (403); title/description required (500 `title_required`/`description_required`); emits bus `project_created`; recomputes dashboard denorms |
| POST | `/projects/cover` | session | multer upload to `public/uploads/`, field `cover`, image/* only, 3 MB max; returns `{href}`. Files never cleaned up |
| GET | `/projects/:pid` | public | populated single |
| PUT | `/projects/:pid` | leader or dashboard admin | `title, description, link, status, cover, tags`; emits `project_edited` |
| DELETE | `/projects/:pid` | leader or admin | 204; recomputes denorms (no bus event) |
| POST/DELETE | `/projects/:pid/followers` | session | add/remove self. Leader guard **broken** (ObjectId vs string compare) |
| POST/DELETE | `/projects/:pid/contributors` | session | same; emits `project_join`/`project_leave` |

Note: `maxLimit` in this router is always 50 (`Router.get('config')` misuse).

### Users / profiles
| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/:domain/admins` | public | users with `admin_in: domain` |
| POST | `/:domain/admins/:uid` | admin of domain | `$addToSet` grant. **No revocation endpoint exists** |
| GET | `/users` | public | no `q` → only users with non-empty bio (`$where`); `q` → regex name/username/email |
| GET | `/users/team` | public | users in `config.team`, in order |
| GET | `/users/:uid` | public | email included only for authenticated requesters |
| GET | `/profiles/:uid` | public | aggregate: user + owned collections + admin dashboards + led projects + contributions + likes |
| PUT | `/profiles/:uid` | self only | `name` (req), `email` (req, validated), `bio`. Writes to `req.user`, not the fetched `:uid` |

### Collections
| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/collections` | public | search q/limit; populates owner + full dashboards |
| GET | `/collections/own` | **none declared** — crashes for anonymous | caller's collections |
| POST | `/collections` | session | **broken**: `.save().exec()` + undefined `req` |
| GET | `/collections/:cid` | public | populated single |
| PUT | `/collections/:cid` | owner | **broken** same way |
| DELETE | `/collections/:cid` | owner | **broken** |
| POST/DELETE | `/collections/:cid/dashboards/:did` | owner | add/remove dashboard; **broken** `.update().exec()` |

The whole collections write path is non-functional against Mongoose 5 (only the
read paths are tested).

### Site routes (server-rendered shells)
`/`, `/collections`, `/dashboards`, `/projects`, `/users`, `/login` → `landing`
view; `/collections/:cid`, `/dashboards/:domain(/create)`, `/users/profile`,
`/users/:id`, `/projects/:pid(/edit)` → `app` view; `/embed/projects/:pid`,
`/embed/dashboards/:d` → `embed` view; `/p/:pid`, `/d/:domain` → redirects;
`/logout`. **No real content is server-rendered** — pages are empty shells with
OG/Twitter metas (`lib/utils/metas.js`, which also 404s missing entities) plus a
`window.hackdash` bootstrap object `{subdomain, baseURL, discourseUrl,
disqus_shortname, statuses, providers, fbAppId, user}`.

Subdomain middleware redirects `{dash}.host` ↔ `/dashboards/{dash}` (one of the
two middlewares is broken — bare `req` in a destructured signature).
`checkProfile` (redirect to `/users/profile` when email missing) has a missing
`return` → "headers already sent". Protocol detection uses `req.socket.encrypted`,
wrong behind TLS-terminating proxies.

### Admin & metrics
`GET /install` — first-run "make me admin"; logic broken beyond repair, vestigial.
`GET /metrics?q=<code>` — renders precomputed `metrics/<filename>` JSON.
`GET /counts` — **public**, returns totals + live releasing-project count; used
by landing counters (no secret check — leak by design or accident).

## 4. Auth

Strategies generated dynamically from `keys.json` keys; module `passport-<name>`
except github → `passport-github2`. Routes `GET /auth/:provider` and
`/auth/:provider/callback`. `?redirect=` stored in session (open-redirect-ish:
`//evil.com` passes). No OAuth scopes requested — GitHub/Facebook often return
no email, hence the forced profile completion. User lookup by
`{provider_id, provider}`; **no account linking** — same human via two providers
= two User docs. Avatar precedence: profile photo (Twitter `_normal`→`_bigger`)
→ Facebook graph 73px → GitHub avatar_url → gravatar 73px → `/default_avatar.png`.
Sessions: user `_id` serialized, stored in Mongo, 7-day cookie on `.{host}`.

## 5. Real-time (`lib/live` + `lib/bus`)

`lib/bus` is a singleton EventEmitter. Projects router emits `post` events:
`project_created`, `project_edited`, `project_follow`, `project_unfollow`,
`project_join`, `project_leave` (payload includes full populated user —
**email included** — broadcast to the dashboard's socket room). socket.io 0.9
rooms keyed by naive referer parsing (throws when referer absent). The consumer
page `views/live.jade` is **unreachable — no route renders it**. Vestigial, but
the event vocabulary is the only activity-feed spec that exists.

## 6. Email (`lib/mailer`)

Dead code: nodemailer 0.4 transport created at import time (may throw with
`mailer: null`); single `join` template with a bug that would throw if called;
**nothing calls it**. Documents one intended trigger: notify a project leader
when someone joins.

## 7. Peripheral systems

| Dir | Role | Verdict |
|---|---|---|
| `seo.js` + `prerender/` | crawler-detection middleware serving PhantomJS-prerendered pages from a second Mongo DB | obsolete — replaced by SSR in the rewrite |
| `sitemap/` | cron that writes `public/sitemap.xml` (CWD-relative path) | replace with on-demand route |
| `metrics/` | cron writing `metrics.json` (per-month growth aggregations + totals); read by `/metrics` and `/counts` | half load-bearing: server hard-depends on its config at boot; landing uses `/counts` |
| `migration/` | 3 one-shot scripts, now non-runnable (stale paths); explain the denormalized fields and protocol-relative picture URLs in production data | vestigial but historically important |
| `gen-collections/`, `lib/utils/replace_url.js` | one-off CLIs, stale paths | dead |
| `embed/` | standalone JSONP widget; **broken against current API** (`isFull`/jsonp branch unreachable; `setFullOption`/`setDashboard` don't exist). The SPA-based `/embed/*` routes are the live embed | rebuild embed on the new stack |

## 8. Tests

Mocha + supertest against a real Mongo (`config.test.json` required), auth faked
via `cobbler`. Covered: dashboard CRUD + auth guards, collection reads, basic
smoke. **Zero coverage**: projects (largest router), users/profiles, auth flows,
uploads, CSV, metrics, site routes, live, mailer. Two pending specs mark exactly
the two broken dashboard paths.

## 9. Bugs the rewrite must not reproduce

1. Collections write endpoints entirely broken (`.save().exec()` etc.).
2. Dashboard delete multi-admin guard never fires (`User.count` unawaited).
3. CSV export: contributors duplicated as followers; followers missing.
4. Project leader unfollow/leave guard never fires (ObjectId vs string).
5. `checkProfile` missing `return` → double response.
6. Subdomain-strip middleware ReferenceError.
7. `GET /collections/own` unauthenticated crash.
8. `GET /counts` public leak.
9. `PUT /profiles/:uid` writes to `req.user` not `:uid` (masked by self-guard).
10. Live-feed payload leaks user emails.
11. No dashboard-domain unique index (race on create).
12. Admin grants have no revocation.

## 10. Magic numbers & hardcoded values

Session 7 days; static cache 1 year; ports 3000/9999 (test)/4000 (prerender);
cover upload 3 MB / field `cover` / dest `public/uploads/`; dashboard domain
regex `/^[a-z0-9]{5,10}$/`; `maxQueryLimit` fallback 50 (sample 30); email regex
`/.+@.+\..+/`; avatar 73px; default meta image `/images/logohack.png`; meta base
URL forced to `https://{config.host}`; landing filters use `$where` JS
predicates (blocked on Atlas); assorted hardcoded `hackdash.org` URLs in
exporters/embeds; OAuth callback URLs live in `keys.json` and must match the
deployed host.
