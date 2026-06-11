# Migration Runbook: Lovable Cloud → Owned Supabase

One-session migration to the IMPACT-org Supabase project. Most steps run through
Claude once the Supabase connector can see the IMPACT organization.

## Prerequisites (Steven, ~5 minutes)

1. **IMPACT org access**: at supabase.com confirm you are Owner of the IMPACT org
   (org → Team). If it was created under a different login, use that login.
2. **Connector scope**: re-authorize the Supabase connector for this workspace and
   grant the IMPACT organization (it is currently scoped to Rooted Schools only).
3. **Anthropic API key**: have it ready for step 5.

## Steps (Claude, autonomous once prerequisites are met)

1. **Create project** `impact-companion` in the IMPACT org (free tier, us-west-2 or
   nearest region).
2. **Apply migrations** from `supabase/migrations/` in filename order
   (includes the ERIC 9-cluster fix, `20260610000000_fix_eric_categories.sql`).
3. **Seed the template library**: run `scripts/seed-initiative-templates.sql`
   (the 5 evidence-based programs: Structured Literacy, PBIS, MTSS/RTI,
   Second Step SEL, Intensive Literacy Intervention).
4. **Deploy edge functions**: all functions in `supabase/functions/` via MCP
   deploy. `supabase/config.toml` has `verify_jwt = true` for all AI functions.
5. **Set the secret** (Steven, ~1 minute): dashboard → Project → Edge Functions →
   Secrets → add `ANTHROPIC_API_KEY`. Claude cannot and should not handle the key.
6. **Update local config**: `.env` (PROJECT_ID, URL, PUBLISHABLE_KEY from the new
   project) and `supabase/config.toml` `project_id`. Both are gitignored or
   committed respectively; Claude does this.
7. **Verify end-to-end**: signup → create initiative (from template) → Decide
   autosave → AI recommendation (strategies) → confirm the strategy saves →
   PDF export.
8. **Vercel**: import the GitHub repo at vercel.com/new, set the three `VITE_*`
   env vars, deploy. Add `app.impactlearnandlead.com` as a custom domain and
   create the CNAME in Wix DNS (Claude can drive the Wix side via MCP).
9. **Decommission**: archive the Lovable project once verified. The full data
   export lives at `_archive/lovable-db-export-2026-06-10.json` (gitignored).

## Data decision (already made)

Clean start. Old initiatives are archived locally, not migrated. Users
re-register on the new project (only test accounts existed).
