-- ISST implementation phase for a saved strategy, so the strategy timeline can
-- place each strategy on the implementation arc. Nullable: strategies without a
-- phase (e.g. manually added) render in an "Anytime" bucket.
ALTER TABLE public.implementation_strategies
  ADD COLUMN IF NOT EXISTS implementation_phase text
  CHECK (implementation_phase IS NULL OR implementation_phase IN (
    'planning', 'early_implementation', 'implementation_evaluation', 'confirmation_sustainability'
  ));
