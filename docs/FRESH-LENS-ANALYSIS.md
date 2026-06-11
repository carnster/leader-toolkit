# IMPACT Implementation Companion — Fresh Lens Analysis & Roadmap

**Prepared for:** Steven Carney
**Date:** June 10, 2026
**Sources:** *Implement with IMPACT* (full book), EEF *A School's Guide to Implementation* (guidance report + summary of recommendations), Explore framework, implementation plan template v0.2, master checklist, PRD v0, complete codebase audit, live database inspection.

---

## 1. Executive Summary

**The verdict in one sentence:** This app is a promising skeleton of the right product — the stages are named correctly and the data model is sound — but it does not yet *embody the book*, and in several places it actively undermines the trust a school leader must have in it.

**What it gets right.** The five-page structure maps to the implementation journey. Active ingredients with core/adaptable distinction, fidelity logging, PDSA cycles, leading/lagging indicators, and AI-assisted planning are all the right primitives. The Supabase data model (15 tables, RLS) is a workable foundation. The AI strategy recommender was already grounded in the real ERIC taxonomy.

**What it gets wrong, in order of severity:**

1. **It shows school leaders fake data.** The Implement, Monitor, and Sustain pages render hardcoded mock observations, indicators, and routines indistinguishable from real data. A leader could make a staffing or coaching decision based on "Sarah Chen's October fidelity check" — a person and observation that never existed. *(Fixed terminology: this is the difference between a companion and a liability.)*
2. **It is a form-filling system; the book describes a learning system.** *Implement with IMPACT* is about implementation as ongoing colearning — Engage, Unite, Reflect; deliberately developmental culture; the knowing-doing gap. The app asks users to complete fields. Nothing in it creates the weekly rhythm, the team conversation, the reflection, or the celebration the book treats as the actual engine of implementation.
3. **It doesn't match the book's framework.** The book defines **four stages** — Decide → Plan & Prepare → Implement → Spread & Sustain — with **monitoring embedded throughout the Implement stage**, not a fifth sequential phase. The app's terminology drifts from the author's own vocabulary in multiple places.
4. **The complex system it serves isn't modeled.** Schools are multi-initiative, multi-role, politically real environments. The app has no role enforcement (a teacher account can edit the budget), no audit trail, no gating (you can "complete" Decide without defining a problem), and a fragile initiative-selection mechanism that can silently load the wrong initiative's data.

**The opportunity.** Implementation tools for schools are either generic project managers (Asana with education paint) or compliance dashboards. Nothing on the market is a *framework-faithful implementation companion* that walks a team through a research-based process while doing the implementation-science thinking alongside them. The book gives this app something no competitor has: a coherent methodology, a vocabulary, reproducible tools, and an author. The product becomes defensible exactly to the degree that it is the book made operational.

**Status of this round:** The ERIC framework mischaracterization (an invented "Enable/Redesign/Integrate/Create" backronym in place of the real 9-cluster Powell et al. 2015 taxonomy) has been **fixed end-to-end** — live database migrated with content-based remapping of all 16 existing strategies, UI re-grounded in the 9 real clusters with education-adapted labels, and the previously broken save path for AI-recommended strategies repaired. Everything else in this document is roadmap.

---

## 2. Framework Fidelity Audit — The Book vs. The App

This is the most important section, because the app's entire reason to exist is to be the book's companion.

### 2.1 Stage model mismatch (decided: restructure)

| | The book | The app today |
|---|---|---|
| Stages | **4**: Decide → Plan & Prepare → Implement → Spread & Sustain | **5**: Decide → Plan → Implement → Monitor → Sustain |
| Monitoring | Embedded *throughout* Implement ("Gathering implementation data," "Harnessing data for strategic action," Ch. 6) | A separate sequential stage between Implement and Sustain |
| Stage names | "Plan and Prepare," "Spread and Sustain" | "Plan," "Sustain" |

**Why it matters:** A leader who has read the book opens the app and finds a different framework. A leader who hasn't read the book learns the wrong one. Monitoring-as-a-stage also teaches the most dangerous implementation misconception there is: that you implement *first* and look at data *later*.

**Decision (approved):** Restructure to the book's four stages. Monitoring becomes a **cross-cutting Data & Monitoring hub** accessible from every stage — most prominently inside Implement. The current Monitor page's contents (indicators, fidelity trends, PDSA, phase tracking) survive; they just stop being a sequential gate.

### 2.2 Terminology drift

The book has precise vocabulary the app should use verbatim, with in-app definitions:

| Book term | Status in app |
|---|---|
| Active ingredients (core vs. adaptable periphery) | ✅ Present and correct |
| Fidelity / adaptation vs. de-implementation | ⚠️ Fidelity present; the adaptation/de-implementation distinction — central to Ch. 5 — absent |
| Implementation literacy | ❌ Absent |
| The adopt-and-abandon cycle | ❌ Absent (this is the book's "why" — it belongs in onboarding) |
| Knowing-doing gap / deliberately developmental | ❌ Absent |
| Engage, Unite, Reflect (team behaviors, Ch. 3) | ❌ Named in PRD, almost invisible in app |
| Contextual factors (enabling structures / intervention features / agents) | ❌ Not captured anywhere |
| Readiness: structures, will, skill, climate | ⚠️ App has a 5-factor feasibility score; not the book's framing |
| ERIC (Expert Recommendations for Implementing Change) | ✅ **Fixed this round** |

### 2.3 The book's tools are missing

The book ships ten reproducible tools. A faithful companion should make every one of them a living, in-app artifact (not a static PDF):

| Book tool (page) | App equivalent today |
|---|---|
| Decide Stage Planning Template (p. 117) | Partial (Decision Brief covers much of it) |
| Plan & Prepare Stage Planning Template (p. 148) | Partial (Plan sections cover pieces) |
| Implement Stage Planning Template (p. 186) | ❌ None |
| Assess & Align Framework With Organizational Strengths (p. 38) | ❌ None |
| Define Implementation Science With Your Team protocol (p. 36) | ❌ None |
| Evaluate a Change Theory worksheet (p. 57) | ❌ None — and no theory-of-change capture anywhere |
| Reflect on Building Effective Implementation Teams (p. 86) | ❌ None |
| Map Essential Team Behaviors & Characteristics (p. 87) | ❌ None |
| Assess Individual Characteristics & Behaviors (p. 88) | ❌ None |
| Learning Journey Maps (per chapter) | ❌ None — these would make superb stage-overview screens |

### 2.4 The EEF layer is half-embedded

The EEF master checklist (Explore / Prepare / Deliver / Sustain, with reflection prompts) exists in the reference materials and the PRD requires checklist gating ("Prepare ≥80% before Go Live"). The app has assorted checklists but not the systematic, contextually-surfaced, gate-enforcing checklist system both sources describe. The three EEF contextual-factor categories (enabling structures, intervention features, agents) appear nowhere in the plan data model.

---

## 3. Truth & Trust Audit

A school leader's relationship with this tool is decided in the first week. These findings break trust:

| # | Finding | Evidence | Severity |
|---|---|---|---|
| 3.1 | **Implement page renders fake fidelity logs and nudges** (fictional staff, fictional observations) | `src/pages/Implement.tsx:22-31` (`mockFidelityLogs`, `mockNudges`) | 🔴 Critical |
| 3.2 | **Monitor page falls back to fake indicators and fake completed PDSA cycles** when real data is absent — exactly when a new user is forming trust | `src/pages/Monitor.tsx:37-61` (`indicators.length > 0 ? indicators : mockIndicators`) | 🔴 Critical |
| 3.3 | **Sustain stage is non-functional** — hardcoded routines and onboarding resources, no database wiring at all | `src/pages/Sustain.tsx:19-29` | 🔴 Critical |
| 3.4 | **No stage gating.** A user can skip every Decide step and advance to Plan with no problem statement, no goals, no readiness check | `src/pages/Decide.tsx:1823-1840` (soft skip warnings only) | 🟠 Major |
| 3.5 | **Initiative selection rides on sessionStorage** — stale IDs load yesterday's initiative; multi-initiative leaders can silently edit the wrong one | `src/pages/Decide.tsx:54-55` and equivalents across stages | 🟠 Major |
| 3.6 | **No auto-save** despite the product description claiming "auto-save throughout." Manual save button; navigation mid-flight can lose work | `src/pages/Decide.tsx:1820` | 🟠 Major |
| 3.7 | **No error boundaries** — one component crash takes down the page | absent app-wide | 🟡 Minor |

**Principle for the rebuild:** *the app never shows data that didn't come from this initiative's reality.* Honest empty states with guidance beat plausible fake data every time.

---

## 4. Experience Audit

The PRD's UX principles: "fewer, better steps; 10–15 minute weekly cadence for ILs; 90-second check-ins for teachers; plain language; celebration moments." Against that bar:

- **The Decide wizard is a 1,869-line monolith** asking an overloaded principal to fill ~15 fields across 6 steps with no scaffolding beyond placeholder text. The book would coach the user through each move; the app presents a form. *(Also an engineering problem: the file is unmaintainable.)*
- **No first-run experience.** A brand-new user lands on an empty dashboard with a "New Initiative" button. No orientation to the framework, no sample initiative, no "here's what the next 30 minutes look like."
- **Empty states are dead ends** — e.g., Implement says "No core ingredients defined yet. Add them in the Plan stage" with no link and no explanation of what a core ingredient is (`src/pages/Implement.tsx:92-95`).
- **No journey awareness.** Nothing persistent tells the user *where they are* in the implementation arc, *what's done*, and *what one thing to do next*. The book's Learning Journey Maps are the obvious design language for this.
- **Accessibility is at zero.** A grep across the app finds **no ARIA attributes**. Color-only status signals throughout. The PRD requires WCAG 2.2 AA; schools have legal accessibility obligations and staff with disabilities. This is not polish — it's a launch blocker for district procurement.
- **No teacher experience.** The PRD defines teachers as nudge-receivers with 90-second check-ins. Today the app has one experience for all roles: the full leader cockpit. A teacher asked to "log a quick fidelity check" confronts the entire five-stage apparatus.

---

## 5. Multi-User & Security Audit

The app today is single-player software wearing multi-user clothes:

- **Roles exist but enforce nothing.** Six roles in the profile enum (district leader → governor), yet RLS checks only ownership/team membership. A teacher on the team can edit the budget, rewrite the decision brief, and delete strategies. The PRD requires RBAC; the book's whole Ch. 3 is about differentiated team roles.
- **Edge functions don't verify initiative access** — e.g., `ai-copilot-chat` accepts any initiative context without checking the caller owns or belongs to it (`supabase/functions/ai-copilot-chat/index.ts`). Cross-tenant data leakage through the AI layer.
- **No audit trail.** No `created_by`/`updated_by`, no change history. For a tool holding school data and board-facing decisions, this is a compliance gap (and the PRD names audit logs explicitly).
- **No Governor/Board read-only view, no Evidence Pack.** The PRD's most board-relevant feature — Decision Brief + Plan + data + reflections as one exportable pack — doesn't exist; there are only separate Brief and Dashboard exports.

---

## 6. Fresh Lens: From Form-Filler to Implementation Companion

This is the redesign argument. Everything above fixes defects; this section is what would make the tool one school leaders *evangelize*.

### 6.1 The core design inversion

**Today the app's atomic unit is the form. The book's atomic unit is the cycle.** Implementation in the book happens in rhythms: the weekly implementation-team meeting, the coaching cycle, the PDSA loop, the data review, the celebration. The redesign should make **the cycle the home screen**:

> **"This Week" — the working heart of the app.** For an Implementation Lead, opening the app on Monday shows: the 2–3 actions due this week (from the plan), this week's fidelity-check targets, any indicator that moved, the open PDSA decision, the next team meeting with its auto-drafted agenda, and one Engage/Unite/Reflect prompt. Fifteen minutes, then back to work. The five stages remain as the *map*; "This Week" is the *territory*.

### 6.2 Make Engage / Unite / Reflect structural, not decorative

The book's three team behaviors should be load-bearing:

- **Engage:** every stage carries "whose voice is missing?" prompts; stakeholder-input capture is a first-class data type (not a textarea); the teacher nudge loop ("tried / helpful / needs support") feeds visible "we heard you" responses.
- **Unite:** a one-page, always-current **Initiative Charter** (the why, the goal, the active ingredients, the theory of change) that any staff member can see — the artifact that creates shared understanding. Auto-generated staff brief / family letter / governor update from it.
- **Reflect:** the meeting companion ends every team meeting with the book's reflection prompts; PDSA cycles require a recorded *decision*; a quarterly "Reflect & Celebrate" ritual is built into the timeline by default.

### 6.3 The Meeting Companion is the killer feature

Steven's own workflow proves it: implementation work *is* meeting work. The PRD already specifies it (Phase 2). Elevate it: agenda from plan state → live decision/owner/deadline capture → plan auto-updates → open risks resurface → reflection prompt → recap to team. This single feature converts the app from "another thing to update" into "the thing that updates itself because we met."

### 6.4 An opinionated spine: gates with grace

The book is sequenced for a reason. Implement gating per its exit criteria (Decision Brief complete + readiness ≥ threshold before Plan; Prepare checklist ≥80% before Go-Live; first PDSA decision recorded before scale decisions) — but with grace: a leader can override any gate by recording *why*, which becomes part of the initiative's history. That's how a complex system actually behaves, and the override log is itself implementation data.

### 6.5 De-implementation and the honest "stop"

The book confronts the adopt-and-abandon cycle. The app should let a leader record a **deliberate stop** — with reasons, learning captured, and staff communication drafted — as a *successful outcome path*, not a failure state. No competitor does this; the book demands it (the Sustain stage's "continue / scale / stop and pivot" decision exists in the design overview but has no real workflow).

### 6.6 Equity as a thread, not a checkbox

The book and EEF both center equity. Operationally: required (not skippable) equity prompts in Decide and Plan; subgroup breakdowns on every outcome indicator in the monitoring hub; an alert when subgroup gaps diverge; adaptation requests checked against "does this water down core ingredients for the students who most need them?"

### 6.7 New features the book justifies that no spec yet names

1. **Initiative Portfolio Pressure Check** — schools die by initiative overload (book Intro; PRD risk register). When creating an initiative, the app shows current active initiatives, shared staff, and a candid "your Tier-1 teachers are already on 3 teams" warning.
2. **Implementation Literacy micro-learning** — 2-minute, in-context explainers (from the book's content) at each decision point; the app *teaches the framework while you use it*. This is also the commercial bridge between book and product.
3. **Champion network** — identify champions (an ERIC strategy), give them a lightweight view: their assigned look-fors, their feedback inbox, their celebration shout-outs.
4. **Evidence Pack generator** — board-ready PDF: brief + plan + fidelity/indicator trends + PDSA history + reflections (PRD requirement, still missing).
5. **Year-2 mode** — Spread & Sustain deserves real workflows: onboarding playbooks for new staff, governance calendar hooks, resource-protection checklist tied to budget cycles, scale-readiness scorecard per the book's Ch. 7.

---

## 7. Phased Roadmap

Each phase is independently shippable. Order: **trust → fidelity → experience → multi-user → intelligence → scale.**

### Phase 0 — Truth (days) 🔴
> The app never lies again.
- Remove ALL mock data from Implement, Monitor, Sustain; wire real queries; honest, guiding empty states.
- Initiative context from URL param (single source of truth), not sessionStorage; visible initiative switcher on every page.
- Real auto-save (debounced) + unsaved-changes guard; error boundaries per page.
- ~~Fix ERIC framework~~ ✅ **Done this round.**

### Phase 1 — Book Fidelity (1–2 weeks) 📖
> A reader of the book recognizes the app instantly.
- Restructure to **4 stages + cross-cutting Data & Monitoring hub**; rename to "Plan & Prepare" and "Spread & Sustain."
- Stage gating with grace (per book exit criteria + EEF ≥80% Prepare checklist; override-with-reason).
- Embed the master checklist contextually per stage with progress lights.
- Book vocabulary everywhere + in-app glossary; the book's 10 reproducible tools as living in-app artifacts with PDF export.
- Readiness assessment reframed to structures / will / skill / climate; contextual factors (enabling structures / intervention features / agents) added to the plan data model.
- Theory-of-change capture in Decide (Evaluate a Change Theory worksheet, p. 57).

### Phase 2 — Experience (1–2 weeks) ✨
> An overloaded leader can use it in 15 minutes a week.
- **"This Week" home** for the active initiative (the design inversion in §6.1).
- Refactor Decide into per-step components with coached scaffolding (book-derived guidance per field).
- First-run journey: framework orientation + guided first initiative; Learning-Journey-Map-style stage overviews.
- Accessibility pass to WCAG 2.2 AA (ARIA, keyboard, focus management, non-color signals).
- Celebration moments (stage completions, fidelity streaks, first PDSA decision).

### Phase 3 — Multi-User Reality (1–2 weeks) 👥
> Safe for a real school team.
- RBAC enforced in RLS + UI for all six roles; Governor/Board read-only.
- **Teacher experience:** 90-second check-in view + nudges with tried/helpful/needs-support feedback loop.
- Edge-function auth (verify initiative membership); audit trail (`created_by`/`updated_by` + change log).
- Evidence Pack export.

### Phase 4 — Intelligence (2–4 weeks) 🤖
> The AI thinks like the book.
- Ground every copilot prompt in the book's frameworks and vocabulary (system prompts quoting the book's protocols).
- **Meeting Companion** (§6.3) — agenda → decisions/owners → plan auto-update → reflection.
- Barrier→Strategy mapper using real ERIC clusters tied to recorded barriers; Evidence Explainer ("what this means for your classrooms").
- Subgroup equity monitoring with divergence alerts; nudge engine driven by plan state (not static).

### Phase 5 — Scale (later) 🌐
- District portfolio view + Initiative Portfolio Pressure Check; template provisioning.
- Year-2 / Spread & Sustain deep workflows (onboarding playbooks, governance hooks, scale-readiness scorecard, deliberate-stop path).
- Integrations: calendar (cadence), CSV indicator upload, LMS attendance; SSO.
- RE-AIM analytics views.

---

## 8. Success Criteria

Tie product "done" to the PRD's 12-month outcomes:

| PRD metric | Product capability that drives it |
|---|---|
| ≥75% of projects complete all phase checklists | Gating with grace + contextual checklists (Phase 1) |
| ≥60% positive movement on leading indicators within a term | Monitoring hub + This Week cadence + nudge loop (Phases 1–3) |
| ≥40% improvement on a target pupil outcome | Indicator discipline from Decide + subgroup monitoring (Phases 1, 4) |
| ≥80% user satisfaction / NPS ≥50 | Experience phase + teacher view + Meeting Companion (Phases 2–4) |

**Definition of done per phase:** every phase ships with (a) no mock data anywhere it touches, (b) WCAG-clean for any new UI, (c) book-faithful terminology verified against the extraction in this document's §2, and (d) a working end-to-end demo on the live database.

---

## Appendix A — ERIC Fix Record (completed June 10, 2026)

- Live DB: dropped fake CHECK constraint; remapped all 16 existing strategies to real clusters based on content (e.g., "Establish a 'Student Connection Fund'" → *Use Financial Strategies*; "Identify and prepare champions"-type team strategies → *Develop Stakeholder Relationships*); added 9-cluster constraint. Migration recorded at `supabase/migrations/20260610000000_fix_eric_categories.sql`.
- New single source of truth: `src/lib/ericClusters.ts` (9 clusters, education-adapted labels: "Support Educators," "Engage Students & Families"; canonical enum values preserved for AI compatibility).
- Components re-grounded: strategy dialog, strategy library (now covering all 9 clusters), plan section grouping, risk mapping, team dashboard, plan PDF export, AI recommendations display.
- Bug fixed: AI-recommended strategies (which always returned real cluster values) previously **failed to save** against the fake constraint; they now persist.
