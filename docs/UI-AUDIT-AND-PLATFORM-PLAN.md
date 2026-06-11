# Addendum: Hands-On UI Audit & Post-Lovable Platform Plan

**Companion to:** [FRESH-LENS-ANALYSIS.md](./FRESH-LENS-ANALYSIS.md)
**Method:** Live walkthrough of the running app (fresh "Principal" account, zero data — exactly what a new user experiences), plus design-token inspection, responsive testing, dark-mode testing, and console monitoring.
**Date:** June 10, 2026

---

## Part 1 — What a Brand-New School Leader Actually Sees

I created a fresh account and walked the app as a first-time principal would. Verified live, not inferred from code:

### 1.1 The fake-data problem, confirmed on screen

With **zero initiatives and zero data**, the app showed me:

| Page | What it showed a brand-new user | Reality |
|---|---|---|
| Monitor | "Key Indicators: Fidelity 4.0/5 (89% to target), Adoption 85%, Staff Acceptability 3.8, Outcome Progress 62" | All fabricated |
| Monitor | "PDSA 1 — **complete** — Attendance increased to 88%, close to target" + "PDSA 2 — testing" | Fabricated improvement cycles, presented as the user's own history |
| Monitor | "Chart visualization would appear here" | A literal placeholder string shipped to production |
| Monitor | Self-contradiction: header says "0 total observations · No fidelity data yet," then indicators below show 4.0/5 fidelity | The page disagrees with itself on one screen |
| Implement | Nudges: "Reminder: Weekly progress checks due Friday — **Due: 10/30/2025**" | Hardcoded, with a date 8 months in the past |
| Sustain | Routines ("Weekly planning meetings, Monday 3:30pm — Owner: **Year 3 Lead**"), onboarding resources marked "complete," **2 of 4 sustainability checklist items pre-checked** | Entirely fake, including pre-checked checkboxes; "Year 3" is UK terminology leaked from EEF source docs |
| Implement | Fidelity log section: "No observations recorded yet, Avg 0/5" | ✅ Honest — proof the team knew how to do empty states and didn't apply it consistently |

**Net effect:** the first impression of the Monitor and Sustain stages — the two stages that most need credibility — is fiction.

### 1.2 Interaction & flow findings

- **Decide works without an initiative.** A new user can open Decide and start typing into a 6-step wizard labeled "Not saved" — with no initiative for the data to attach to. The natural first journey (click Decide, start deciding) leads into a void. The app never forces/offers "create your initiative first."
- **No onboarding moment.** First login lands on a dashboard of four zeros. No orientation to the IMPACT framework, no guided first initiative, no sample to explore.
- **"0 of 0" milestone progress renders a full orange bar** on Implement — an empty state that reads as 100% complete at a glance.
- **The AI Copilot renders on the login page** — before authentication. (It can't do anything useful there; it also implies the AI is available pre-auth.)
- **Good bones to keep:** each stage opens with a genuinely useful "Key Activities for This Stage" framework card; the Decide stepper (1–6 with completion states) is the right navigation idea; stage breadcrumbs ("Stage 1: Decide") exist.

### 1.3 Visual design audit

Inspected design tokens and rendered styles:

- **Palette (HSL tokens):** primary deep navy `215 80% 25%`, secondary coral `15 85% 55%`, accent amber `35 90% 55%`, success teal `175 70% 38%`. **Verdict: this is a good, distinctive education palette** — calm authority (navy) + warmth (coral). Keep it. Problems are in *application*, not selection: coral/amber appear almost nowhere (the app reads as navy-on-white throughout), and status colors are used inconsistently (the fake-full progress bar is orange = secondary, not a status color).
- **Typography: system font stack** (`ui-sans-serif, system-ui`). No brand typeface loaded despite Tailwind config; h1 30px/700. Functional but generic — for a branded companion product (IMPACT Educational Partners logo is in the header), a single distinctive display face for headings would carry the brand. Body text sizes and line lengths are fine.
- **Dark mode is dead.** `next-themes` is installed but `ThemeProvider` is never mounted and no toggle exists; `prefers-color-scheme: dark` does nothing. The product description claims "full dark mode support" — currently false. Either wire it (small task) or remove the claim.
- **Layout:** card-grid layouts are clean and consistent (shadcn defaults doing their job). Spacing rhythm is good. The Dashboard KPI cards, however, lead with zeros/N-A for new users — four gray boxes of nothing as the hero moment.
- **Iconography:** lucide icons used sensibly; stage icons (search/document/play/chart/shield) are appropriate metaphors.
- **Mobile (375px):** structurally sound — nav collapses to hamburger, cards stack. Minor: dense card metadata wraps awkwardly (routine cards show "Every Monday 3:30pm • Owner: Year 3 Lead" in a cramped 3-column squeeze). No blocking mobile failures found.
- **Console:** clean — no runtime errors or warnings during the walkthrough. Build is healthy.

### 1.4 Tools & supports gap (what "fully usable" still requires)

Beyond the Fresh Lens roadmap, the walkthrough surfaced the practical supports a real team needs that the app lacks:

1. **In-context help system** — the stage-essentials cards are the seed; there's no field-level "what does a good problem statement look like?" with book-grounded examples, no glossary, no help center.
2. **Real notifications** — a bell icon exists in the nav; clicking it goes nowhere meaningful. No email digests, no deadline alerts, nothing arrives where school leaders live (email/calendar).
3. **Data import/export beyond PDF** — no CSV import for indicator values (PRD Phase-1 requirement), no CSV export, no calendar (.ics) output for meeting cadences and milestones.
4. **Search** — nothing is searchable; `cmdk` (command palette) is installed and unused. A leader with 4 initiatives can't find "where did we write down the phonics decision?"
5. **Print styles** — board members will print; there are none.
6. **Session/team supports** — no invite flow visible for adding team members by email; no shareable read-only links (PRD requires Decision Brief share links).

---

## Part 2 — Post-Lovable Platform Plan

**Decision:** Leave Lovable entirely. The app will live in GitHub and deploy on standard, low-cost infrastructure.

### 2.1 What Lovable currently owns (the lock-in surface)

Verified in code and live:

1. **The database + auth.** The Supabase project (`olxlcpsizneihjxpebzg`) is provisioned under Lovable Cloud's account, not Steven's Supabase org. All data and user accounts live there.
2. **All AI features.** Every one of the 13 edge functions calls Lovable's AI gateway (`LOVABLE_API_KEY`, model `google/gemini-2.5-flash`). No Lovable subscription → no AI.
3. **Edge-function hosting** — deployed via Lovable Cloud to that same Supabase project.
4. **Build artifacts** — `lovable-tagger` in `vite.config.ts` + `package.json`; Lovable og-image/social meta tags in `index.html`.
5. **Hosting/preview** — Lovable's publish flow (replaceable by any static host; the app is a pure Vite SPA).

### 2.2 Target architecture (best tools, lowest cost)

| Layer | Tool | Cost | Why |
|---|---|---|---|
| Code | **GitHub** (already there) | $0 | Source of truth; PR-based workflow; CI via Actions free tier |
| Frontend hosting | **Vercel** (Hobby) | $0 now | Push-to-deploy from GitHub, preview deployments per PR, custom domain. ⚠️ Hobby tier prohibits commercial use — when this becomes a paid/School-facing product, Pro is $20/mo (or switch to Cloudflare Pages, $0 with commercial use allowed) |
| Database + Auth + Edge Functions | **Supabase free tier, Steven's own org** | $0 now | The app is already 100% Supabase-native — migrations re-run as-is. Free tier: 500MB DB, 50K MAU auth. ⚠️ Free projects **pause after 1 week of inactivity**; fine during build, upgrade to Pro ($25/mo) when real schools depend on it |
| AI | **Google Gemini API direct** (`gemini-2.5-flash`) | $0–low | The edge functions already use Gemini's request shape via Lovable's gateway — swapping to Google's OpenAI-compatible endpoint is a base-URL + API-key change, not a rewrite. Google's free tier covers development; paid usage at this scale is dollars/month. *(Upgrade path: move the user-facing AI Copilot to Claude Haiku 4.5 for noticeably better coaching-style chat, keep Flash for bulk recommendations.)* |
| Email (later, Phase 3+) | **Resend** free tier | $0 | 3K emails/mo free — covers notification digests for pilot schools |
| Error tracking | **Sentry** free tier | $0 | Know when school leaders hit errors before they tell you |
| **Total today** | | **$0/mo** | First real money: Supabase Pro ($25/mo) when pilot schools are live |

### 2.3 Migration steps (one working session)

1. **Create Supabase project** in Steven's own org → run the repo's `supabase/migrations/` against it (they're all in git, including the ERIC fix).
2. **Migrate data.** Current production data is small (a handful of test initiatives). Export via SQL from the Lovable DB (I have query access), import into the new project. Auth users do not migrate with passwords — with only test accounts existing, users simply re-register. *(Decision needed: bring the data, or treat the new project as a clean start? Recommend clean start + keep a JSON export of the old data as archive.)*
3. **De-Lovable the AI:** in each edge function, replace the Lovable gateway URL + `LOVABLE_API_KEY` with the Gemini API endpoint + `GEMINI_API_KEY` (Supabase secret). Prompts, tool schemas, and response handling stay as-is.
4. **Deploy edge functions** to the new project via Supabase CLI (`supabase functions deploy`), set secrets.
5. **Scrub the repo:** remove `lovable-tagger` from `vite.config.ts`/`package.json`; replace Lovable meta tags in `index.html` with IMPACT branding; update `.env` to the new project's URL/keys; write a real README.
6. **Connect GitHub → Vercel:** import the repo, set env vars, deploy. Every push to `main` auto-deploys; every PR gets a preview URL.
7. **Verify end-to-end** on the new stack: signup → create initiative → Decide save → AI recommendation → strategy persists → PDF export.
8. **Decommission:** archive the Lovable project once the new stack is verified.

### 2.4 What this unlocks

- **No platform tax** — every tool above is replaceable; nothing is proprietary.
- **Real engineering workflow** — branches, PRs, preview deploys, CI checks (typecheck + build on every PR), code review by Claude.
- **The roadmap gets cheaper** — Phases 0–5 from the Fresh Lens execute directly in this repo with standard tooling, no Lovable credits, no prompt-roundtrips through a builder.

---

## Part 3 — Additions to the Roadmap

These findings slot into the existing phases:

- **Phase 0 (Truth)** adds: fix the "0 of 0 = full bar" progress display; remove pre-checked checklist states; remove "Chart visualization would appear here" placeholder; block stage pages (or guide to initiative creation) when no initiative exists; remove AI copilot from the auth page.
- **New Phase 0.5 (Platform):** the Lovable exit (§2.3). Should run *before* Phase 1 so all subsequent work deploys to owned infrastructure.
- **Phase 2 (Experience)** adds: wire dark mode (or drop the claim); brand typography; apply the coral/amber palette intentionally (stage accents, celebration moments, data-viz); command-palette search (`cmdk` is already installed); fix mobile metadata wrapping; print styles.
- **Phase 3 (Multi-user)** adds: team-member invite flow; shareable read-only Decision Brief links; real notification center + email digests (Resend).
- **Phase 4 (Intelligence)** option: split AI by job — Gemini Flash for bulk generation, Claude Haiku 4.5 for the conversational copilot.

---

## Appendix — Test artifact

A test account was created during this audit: `ui.audit.leadertoolkit@gmail.com` (role: Principal, no initiatives). Delete it whenever — or keep it as a permanent "fresh user" QA account.
