-- Persist the Equity & Inclusion Checklist (previously client-side only) and
-- allow AI-recommended EBPs to prefill it.
-- Shape: { "checked": { "<item_id>": true }, "notes": { "<item_id>": "..." } }
ALTER TABLE decision_briefs ADD COLUMN IF NOT EXISTS equity_checklist jsonb;
