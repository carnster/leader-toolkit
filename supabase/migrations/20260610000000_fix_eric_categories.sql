-- Fix ERIC framework mischaracterization.
-- The original schema used an invented 4-category backronym ("enable/redesign/integrate/create").
-- The real ERIC framework (Powell et al. 2015, Implementation Science) defines 73 discrete
-- implementation strategies organized into 9 clusters. The recommend-strategies edge function
-- already returns these 9 cluster values, which violated the old CHECK constraint.
-- Applied to the live database on 2026-06-10 with content-based remapping of existing rows.

ALTER TABLE implementation_strategies DROP CONSTRAINT IF EXISTS implementation_strategies_eric_category_check;

-- Map any legacy values to their closest real ERIC cluster
UPDATE implementation_strategies SET eric_category = CASE eric_category
  WHEN 'enable' THEN 'train_educate'
  WHEN 'redesign' THEN 'change_infrastructure'
  WHEN 'integrate' THEN 'evaluative_iterative'
  WHEN 'create' THEN 'develop_stakeholder_relationships'
  ELSE eric_category END
WHERE eric_category IN ('enable','redesign','integrate','create');

ALTER TABLE implementation_strategies ADD CONSTRAINT implementation_strategies_eric_category_check
  CHECK (eric_category IN (
    'evaluative_iterative',
    'provide_interactive_assistance',
    'adapt_practice',
    'develop_stakeholder_relationships',
    'train_educate',
    'support_clinicians',
    'engage_consumers',
    'use_financial_strategies',
    'change_infrastructure'
  ));
