# i18n message catalogs — notes

Catalogs: `apps/web/messages/{en,es,pt}.json` (273 leaf keys each, identical
structure). Format: next-intl / ICU. Source: `legacy/client/app/locale/{en,es}.js`
(es was the more complete of the two and is authoritative for meaning);
pt is a fresh Brazilian-Portuguese translation, informal "você" register.

## Structure rationale

Namespaces follow the app's surfaces, not the legacy template files:
`common` (actions, the six project statuses, generic states, plural counts,
relative time, theme + language switchers), `nav`, `auth`, `landing` (hero,
tabs, search, counts, features, team/partners, about), `dashboard` (wall,
edit form, admin tools, showcase, share/embed builder, csv, delete),
`project` (card, form incl. GitHub import + cover errors, detail, delete,
embed), `collection`, `profile`, `feed`, `errors` (404/500 pages + one human
message per `ServiceErrorCode` in `packages/db/src/errors.ts`, plus
`unknown`). Statuses live at `common.status.*` in the canonical server order
(`packages/db/src/statuses.ts`); `common.status.label` is the field label.

## Legacy → new key mapping (non-obvious cases)

- Positional `{1}` → named ICU: `cannot_remove_dashboard` →
  `dashboard.delete.cannotRemove` with `{name}`.
- Concatenation pairs → single ICU strings: `" has been added to "` /
  `" has been removed from "` → `collection.addedTo` / `removedFrom`
  (`{name}`, `{collection}`); `"This action will remove Dashboard "` +
  `". Are you sure?"` → replaced by the type-the-domain delete flow
  (`dashboard.delete.*`).
- `"Hacking at"` (social share prefix) → `project.detail.hackingAt` with
  `{dashboard}`.
- Landing counters (`dashboards`, `projects`, `registered users`, …) →
  `landing.counts.*` as `{count, plural, …}` (legacy showed bare nouns next
  to a number).
- Loading/saving ellipsis strings (`saving...`, `joining...`, `LOADING`) →
  `common.actions.saving`, `project.card.joining` etc., with a proper `…`;
  `LOADING` (GitHub import) → `project.form.github.importing` ("Importing…").
- `"Slider"` (embed builder 1–6 control) → `dashboard.share.embed.columns`
  ("Columns"): per the improvement plan, `slider` maps to grid column count.
- `"Showcase"`: es keeps legacy "Galería"; pt uses "Vitrine".
- `"File is too big, 500 Kb is the max"` → `project.form.cover.tooBig` with a
  `{max}` variable (the limit is being unified at 5 MB; don't hardcode it).
- Legacy en typo "coping this code" fixed to "copying" in both embed
  instruction strings.
- Delete-guard strings (`Only the Owner…`, `Only Dashboards with ONE
  admin…`, `Only Dashboards without Projects…`) exist twice on purpose:
  as dialog copy under `dashboard.delete.guards.*` and as API error messages
  under `errors.api.dashboard_has_admins` / `dashboard_has_projects` (the
  route layer maps `ServiceError.code` → `errors.api.<code>`).

## HTML-string conversions

- `"The HackDash was born"` (about block with raw `<a>` tags) →
  `landing.about.body` using next-intl rich-text tags: `<mediaParty>`,
  `<hhba>`, `<blejman>`, `<dzajdband>`. Render with `t.rich` mapping each
  tag to a link (mediaparty.info, twitter.com/HacksHackersBA, /blejman,
  /dzajdband). The trailing `<p><a class="up-button">…</a></p>` CTA was
  split into `landing.about.cta` with a `<cta>` tag (renders as the
  create-dashboard button/link). Added `landing.about.title` (legacy had no
  heading key).
- `"[ Log in to reveal e-mail ]"` was **dropped**: the rewrite makes email
  visible only to its owner (improvement plan §2.7), so there is no
  reveal-on-login state. `profile.edit.emailPrivacy` replaces the legacy
  "email only visible for logged in users" note accordingly.

## Dropped / obsolete legacy keys

Locale metadata (`code`, `time_format`, `date_format`, …) — date/time
formatting belongs to next-intl formatters, not messages. Also dropped:
`HEAD`, `up`, `off`/`turned_off`, `embed/insert`, `View`+`My Collections:
adding` from the dead Bootstrap-2 collections modal (the restored collections
UI uses `collection.addToCollection` / `myCollections` instead), and the
`Warning! you will NOT` semantics — kept as `dashboard.admin.addAdminWarning`
but see review list.

## For translator / product review

1. **`dashboard.admin.addAdminWarning`** is the legacy guard message; with
   admin revoke and the fixed delete flow it is likely obsolete — confirm
   whether to ship or delete it (in all three files).
2. **Status labels** had no legacy translations (statuses rendered in
   English even in es). es "Lluvia de ideas / Bocetos / Desarrollo /
   Investigación / Prototipo / Lanzamiento" and pt "Ideação / Wireframes /
   Desenvolvimento / Pesquisa / Protótipo / Lançamento" are new — worth a
   community pass, since they appear on the brand progress bar everywhere.
3. **es register**: legacy mixed tuteo and voseo ("Creá tu propio tablero",
   "Ingresá"). Standardized to neutral LatAm tuteo throughout; if the
   Buenos Aires voseo flavor is wanted it's a mechanical pass.
4. **es gender of "hackatón"**: legacy used feminine ("una hackatón");
   kept feminine consistently (`landing.hero`, `dashboard.form`).
5. **About text**: legacy said "Three years later… becoming a standard";
   updated to the timeless "Years later, the dashboard has become a
   standard…" in all languages — confirm the copy (it's ~13 years now).
6. **es copy fixes** vs legacy: "colectciones"→"colecciones",
   "eliminador"→"eliminados", "sobre tí"→"sobre ti",
   "innovadores"→"innovadoras", "abandondando"→"abandonando";
   "es requerido" (anglicism) → "es obligatorio".
7. **pt "painel"** was chosen over the loanword "dashboard" (matches es
   "tablero"); if the community prefers "dashboard", it's a find-replace in
   `pt.json` only.
