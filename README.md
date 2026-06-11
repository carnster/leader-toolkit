# IMPACT Implementation Companion

The digital companion to *Implement with IMPACT* — an AI-guided workspace that helps school
leaders and implementation teams take an initiative from decision through sustained practice:
**Decide → Plan & Prepare → Implement (with continuous monitoring) → Spread & Sustain**.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- **AI:** Google Gemini (`gemini-2.5-flash`) via Supabase Edge Functions
- **Charts / PDF:** Recharts, jsPDF + autotable
- **Hosting:** Vercel (SPA rewrites configured in `vercel.json`)

## Local development

```sh
bun install
bun run dev          # http://localhost:8080
```

Requires a `.env` file (not committed):

```
VITE_SUPABASE_PROJECT_ID="<project-id>"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"
VITE_SUPABASE_URL="https://<project-id>.supabase.co"
```

## Backend

- Database schema lives in `supabase/migrations/` (run in order on a fresh project).
- Edge functions live in `supabase/functions/` — deploy with `supabase functions deploy`.
- Functions require the `GEMINI_API_KEY` secret: `supabase secrets set GEMINI_API_KEY=...`
- All AI functions require an authenticated user JWT (`verify_jwt = true` in `supabase/config.toml`).

## Reference material

`reference/` holds the source frameworks this product embodies: the *Implement with IMPACT*
book, the PRD, and the schools-implementation guidance the in-app checklists derive from.
`docs/` holds the product analysis and roadmap:

- `docs/FRESH-LENS-ANALYSIS.md` — framework-fidelity, trust, experience, and security audit + phased roadmap
- `docs/UI-AUDIT-AND-PLATFORM-PLAN.md` — hands-on UI audit + platform migration plan
