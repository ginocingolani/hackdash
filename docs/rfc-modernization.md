# RFC: Modernizing HackDash (draft for the upstream maintainers)

*Draft to adapt and post as a GitHub issue/discussion on `impronunciable/hackdash`,
or to share directly with the maintainers before anything goes public.*

---

Hi! I'd like to propose (and do the work for) a full modernization of HackDash.

**Why now.** The current codebase targets Node 0.10 and depends on several
end-of-life pieces: Express 4.12 with Jade, Mongoose 5, Passport 0.2 (the
Twitter and Meetup strategies no longer work against today's provider APIs),
socket.io 0.9, and a Backbone/Marionette client built with Grunt/Browserify.
It can no longer be safely deployed or easily contributed to, and the last
commit was in September 2023.

**What I'm proposing.** A ground-up rewrite that treats the current code as the
spec: same domain model (users, dashboards, projects, collections, statuses),
same MongoDB data (schemas ported field-for-field so existing hackdash.org data
migrates non-destructively), same MIT license with original attribution
preserved. New stack: TypeScript, Next.js, Mongoose 8, Auth.js, Tailwind, in a
pnpm monorepo. Strictly two phases: (1) feature parity and robustness, (2) only
then, new features.

**What I'd like from you.**
1. Your blessing on the direction, and any context on what parts of the current
   system are load-bearing vs. vestigial (embeds? the live feed? collections?).
2. A preference on where the code should live: a `v2` branch or repo under your
   ownership, a new repo I maintain with you as collaborators, or a fork —
   whatever fits how involved you want to be.
3. Eventually, help cutting over hackdash.org (DNS + a copy of the production
   database for migration testing).

I've already mapped the existing architecture (happy to share the docs) and have
a working monorepo skeleton. Nothing is published yet — I wanted to talk to you
first.

---

*Notes to self (not part of the post): keep the tone of an offer, not a fait
accompli; attach `docs/legacy/` maps once finished; agree on repo location
before pushing anything public.*
