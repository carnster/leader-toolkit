-- PB 14 two-dimension fidelity model (Delivery and Enactment).
--
-- A two-dimension checklist log never collapses Delivery and Enactment into
-- a single 1-5 average, so fidelity_logs.rating stays NULL for those rows.
-- This is additive only: existing 1-5 checklists, existing fidelity_logs
-- rows, and the CHECK's 1-5 bound for any row that does carry a rating are
-- all unchanged.
ALTER TABLE public.fidelity_logs
  ALTER COLUMN rating DROP NOT NULL;

ALTER TABLE public.fidelity_logs
  DROP CONSTRAINT IF EXISTS fidelity_logs_rating_check;

ALTER TABLE public.fidelity_logs
  ADD CONSTRAINT fidelity_logs_rating_check
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5);
