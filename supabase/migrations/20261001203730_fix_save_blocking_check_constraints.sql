-- Two check constraints rejected values the app legitimately writes, so these
-- saves have always failed:
--
-- 1. Sustain's Scale Readiness Scan writes a 0-100 percentage (the UI shows it
--    with a % sign and a 67 threshold), but the column only allowed 1-5. Any
--    rating other than "Not yet" on every dimension failed to save, and the
--    resource-protections change in the same upsert was lost with it.
--    Values from the old 1-5 scale are converted to the same point on 0-100.
alter table public.sustainability_plans drop constraint if exists sustainability_plans_scale_readiness_score_check;
update public.sustainability_plans
   set scale_readiness_score = (scale_readiness_score - 1) * 25
 where scale_readiness_score between 1 and 5;
alter table public.sustainability_plans add constraint sustainability_plans_scale_readiness_score_check
  check (scale_readiness_score is null or (scale_readiness_score >= 0 and scale_readiness_score <= 100));

-- 2. The risk dialog offers Occurred and Resolved; the column only allowed
--    active, mitigated and realized, so marking a risk Occurred or Resolved failed.
alter table public.implementation_risks drop constraint if exists implementation_risks_status_check;
alter table public.implementation_risks add constraint implementation_risks_status_check
  check (status in ('active', 'mitigated', 'realized', 'occurred', 'resolved'));
