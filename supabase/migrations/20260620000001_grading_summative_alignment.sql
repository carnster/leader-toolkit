-- Grading for Learning: add the assessment-design practice the template was missing.
--
-- Surfaced by comparing against the RSF toolkit's version of this template. Its
-- ingredient list was flatter overall (no look-fors, no adaptable boundaries), but it
-- did name one core practice this template only implied: aligning every summative to a
-- named standard. Here that idea existed solely as a look-for on "Team-identified
-- Essential Standards" ("Assessments and the gradebook map to these standards"), which
-- buries a separately coachable, separately observable practice inside another one.
--
-- Authored in this template's richer format (look_fors + adaptable_boundaries) rather
-- than copied flat, and inserted at position 2 so the sequence reads: identify the
-- standards, then align every summative to one.
--
-- Idempotent: the guard makes a re-run a no-op.

UPDATE initiative_templates
SET active_ingredients =
      jsonb_build_array(active_ingredients -> 0)
      || '[{"name": "Every summative aligned to a named standard", "is_core": true, "description": "Every summative task is aligned to a specific, named Essential Standard before it is given. This is the assessment design discipline that makes the rest of the system mean anything: identifying standards and then grading tasks that do not measure them turns standards-based reporting into relabeled point collection.", "look_fors": ["Each summative names the standard it measures on the task itself", "Assessment blueprints exist and are reviewed by the course team before administration", "No summative in the mastery gradebook is untethered to a named standard"], "adaptable_boundaries": ["Assessment format: performance task, written, portfolio, or demonstration", "Whether blueprints are built individually, in course teams, or drawn from a shared bank"]}]'::jsonb
      || (active_ingredients - 0)
WHERE id = '01873ad0-1443-4ec3-a0c1-12e98ac3f93d'
  AND NOT (active_ingredients @> '[{"name": "Every summative aligned to a named standard"}]'::jsonb);
