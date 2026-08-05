-- Look-fors and adaptable boundaries for the five templates that shipped without them.
--
-- These five are identical in both toolkits, so the same content applies to each.
-- Without look_fors the Fidelity Monitoring Plan and Adaptation Protocol render
-- empty for any initiative built from these templates: the feature is present and
-- does nothing, which reads as the product being thin rather than the data missing.
--
-- Written against the four fidelity dimensions (adherence, dosage, quality,
-- participant responsiveness), so each ingredient carries something countable,
-- something that judges how well rather than whether, and where it matters,
-- something that reads the student rather than the adult. Equity checks are
-- indicators rather than afterthoughts: screening reach, acknowledgement rates by
-- group, disproportionality in referrals, and reflection reaching every student.
--
-- The guard makes each statement a no-op if look-fors are already present.

UPDATE initiative_templates SET active_ingredients = (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'name' = 'Universal screening' THEN e || '{"look_fors": ["All three screening windows completed with at least 95 percent of enrolled students assessed", "Screening administered under consistent conditions across classrooms, following the protocol as written", "Results disaggregated by student group before any tier placement decisions are made"], "adaptable_boundaries": ["The screening instrument, provided it is validated for the grade span and skill", "Exact window dates within the fall, winter, and spring ranges"]}'::jsonb
      WHEN e->>'name' = 'Tiered intervention menu' THEN e || '{"look_fors": ["A written menu names each intervention, the skill it targets, and the tier it serves", "Placement follows screening and diagnostic data rather than referral alone", "Every student flagged for Tier 2 or Tier 3 has a named intervention actually running"], "adaptable_boundaries": ["Which specific programs fill each tier, given local licensing and staffing", "Group size and how the intervention block is scheduled"]}'::jsonb
      WHEN e->>'name' = 'Progress monitoring' THEN e || '{"look_fors": ["Tier 2 students monitored at least twice monthly and Tier 3 weekly, with dates recorded", "Graphs show a goal line and a trend line, not a list of raw scores", "Students can name the skill they are working on and say whether they are gaining"], "adaptable_boundaries": ["The monitoring measure and the platform that holds it", "Whether progress is reviewed with students individually or within the group"]}'::jsonb
      WHEN e->>'name' = 'Data meetings' THEN e || '{"look_fors": ["Meetings occur on a published cadence with the same core roles present", "Each meeting ends with named changes, owners, and dates rather than general concern", "Prior decisions are revisited for effect before new ones are made"], "adaptable_boundaries": ["Meeting frequency, with monthly as the floor", "The protocol or agenda format the team uses"]}'::jsonb
      WHEN e->>'name' = 'Check & adjust' THEN e || '{"look_fors": ["Intervention sessions observed at least once per cycle against a written checklist", "Low fidelity triggers coaching support before a student''s plan is changed", "Adjustments are logged so the team can tell a dosage problem from a design problem"], "adaptable_boundaries": ["Who conducts the checks: coach, interventionist peer, or school leader", "Length of the cycle between checks"]}'::jsonb
      ELSE e
    END ORDER BY ord
  )
  FROM jsonb_array_elements(active_ingredients) WITH ORDINALITY AS t(e, ord)
)
WHERE name = 'MTSS/RTI Framework'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(active_ingredients) x WHERE x ? 'look_fors'
  );

UPDATE initiative_templates SET active_ingredients = (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'name' = 'Behavior expectations matrix' THEN e || '{"look_fors": ["Three to five positively stated expectations, posted and identical across settings", "The matrix names what each expectation looks like in specific settings, not just in the abstract", "Students in different grades describe the expectations in consistent language"], "adaptable_boundaries": ["The wording and naming of the expectations, chosen with staff and student input", "How the matrix is displayed in each setting"]}'::jsonb
      WHEN e->>'name' = 'Explicit teaching of expectations' THEN e || '{"look_fors": ["Expectations taught directly at the start of the year and re-taught after each long break", "Lessons include modeling, practice in the actual setting, and feedback, not a read-aloud of rules", "Students can demonstrate the expected behavior when asked, not only recite it"], "adaptable_boundaries": ["Lesson format and who delivers it", "Re-teaching cadence beyond the required points in the year"]}'::jsonb
      WHEN e->>'name' = 'Acknowledgement system' THEN e || '{"look_fors": ["Acknowledgements are delivered at a ratio of at least four positive to one corrective", "Acknowledgement rates reviewed by student group to check that recognition reaches everyone", "Students can explain what earns acknowledgement and find it credible rather than token"], "adaptable_boundaries": ["The form acknowledgement takes: verbal, tangible, schoolwide, or classroom", "Whether acknowledgements accumulate toward anything, and toward what"]}'::jsonb
      WHEN e->>'name' = 'Data-based problem solving' THEN e || '{"look_fors": ["Office discipline referrals reviewed at least monthly by location, time, and behavior type", "Referral data disaggregated by student group every review, with disproportionality named when present", "Each review produces a targeted change with an owner rather than a general reminder to staff"], "adaptable_boundaries": ["The data system that holds referrals", "Which team owns the review, provided it meets monthly"]}'::jsonb
      WHEN e->>'name' = 'Classroom routines & corrections' THEN e || '{"look_fors": ["Active supervision visible: staff moving, scanning, and interacting during transitions", "Precorrections given before predictable difficulty rather than consequences after it", "Corrections delivered calmly, privately where possible, and followed by a path back in"], "adaptable_boundaries": ["The specific correction script and language", "How routines are taught and practiced within each classroom"]}'::jsonb
      ELSE e
    END ORDER BY ord
  )
  FROM jsonb_array_elements(active_ingredients) WITH ORDINALITY AS t(e, ord)
)
WHERE name = 'PBIS (Positive Behavioral Interventions and Supports)'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(active_ingredients) x WHERE x ? 'look_fors'
  );

UPDATE initiative_templates SET active_ingredients = (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'name' = 'Weekly explicit SEL lessons' THEN e || '{"look_fors": ["A lesson delivered every week, with dates logged rather than reconstructed later", "Lessons include modeling and student practice, not discussion alone", "Students use the program''s skill language unprompted during the lesson"], "adaptable_boundaries": ["The day and time the lesson lands in the schedule", "Whether the classroom teacher or a specialist delivers it"]}'::jsonb
      WHEN e->>'name' = 'Embedded practice routines' THEN e || '{"look_fors": ["Skill prompts used outside the lesson, in at least one non-SEL setting daily", "Adults name the skill in the moment rather than referring to good behavior generally", "Students apply a skill without an adult prompting it"], "adaptable_boundaries": ["Which routines carry the prompts: morning meeting, transitions, or dismissal", "The visual cues or reminders used"]}'::jsonb
      WHEN e->>'name' = 'Reinforcement & reflection' THEN e || '{"look_fors": ["Students reflect on their own skill use on a regular, scheduled basis", "Adults acknowledge specific skill use rather than general compliance", "Reflection reaches every student, not only those who volunteer"], "adaptable_boundaries": ["The reflection format: journal, conference, exit ticket, or circle", "How acknowledgement is recorded, if at all"]}'::jsonb
      WHEN e->>'name' = 'Family connection' THEN e || '{"look_fors": ["Take-home materials sent on the program''s cadence, in families'' home languages", "At least one two-way touchpoint per term, not only one-way sends", "Families can name at least one skill their student is learning"], "adaptable_boundaries": ["The channel: paper, app, text, or event", "Whether materials are adapted or sent as published"]}'::jsonb
      ELSE e
    END ORDER BY ord
  )
  FROM jsonb_array_elements(active_ingredients) WITH ORDINALITY AS t(e, ord)
)
WHERE name = 'Second Step Social-Emotional Learning'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(active_ingredients) x WHERE x ? 'look_fors'
  );

UPDATE initiative_templates SET active_ingredients = (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'name' = 'Explicit phonics routines' THEN e || '{"look_fors": ["Systematic phonics taught daily, following the scope and sequence in order", "New patterns introduced explicitly with cumulative review of prior patterns in the same session", "Students apply the taught pattern in reading and in writing during the lesson"], "adaptable_boundaries": ["The published program that supplies the scope and sequence", "Lesson length within the daily minimum the program specifies"]}'::jsonb
      WHEN e->>'name' = 'Phonemic awareness practice' THEN e || '{"look_fors": ["Oral blending, segmenting, and manipulation practiced daily in short sessions", "Practice is oral and does not depend on print, so the skill is genuinely phonemic", "Students manipulate sounds accurately without adult modeling each time"], "adaptable_boundaries": ["Activity formats and materials", "Whether practice is whole class, small group, or both"]}'::jsonb
      WHEN e->>'name' = 'Decodable text practice' THEN e || '{"look_fors": ["Texts used are controlled to patterns already taught, not leveled readers", "Every student reads connected text aloud during the block, not only volunteers", "Students decode rather than guess from pictures or first letters"], "adaptable_boundaries": ["The decodable text series", "Partner, individual, or choral reading structure"]}'::jsonb
      WHEN e->>'name' = 'Error correction routine' THEN e || '{"look_fors": ["Errors corrected immediately, at the point of error, rather than at the end of the passage", "Correction returns the student to the sound-spelling pattern instead of supplying the word", "The student rereads successfully after the correction"], "adaptable_boundaries": ["The exact correction wording, provided it is consistent within a classroom", "How errors are tracked, if they are"]}'::jsonb
      WHEN e->>'name' = 'Vocabulary and background' THEN e || '{"look_fors": ["Key vocabulary pre-taught before the text that requires it", "Word meanings taught with student-friendly definitions and multiple exposures", "Students use the taught words in their own speech or writing"], "adaptable_boundaries": ["Which words are selected and how many per text", "How background knowledge is built: read-aloud, media, or discussion"]}'::jsonb
      ELSE e
    END ORDER BY ord
  )
  FROM jsonb_array_elements(active_ingredients) WITH ORDINALITY AS t(e, ord)
)
WHERE name = 'Structured Literacy Program'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(active_ingredients) x WHERE x ? 'look_fors'
  );

UPDATE initiative_templates SET active_ingredients = (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'name' = 'Diagnostic placement' THEN e || '{"look_fors": ["A diagnostic, not just a screener, identifies the specific skill gap before placement", "Placement matches the diagnosed gap rather than the grade level or available group", "Placement is re-checked when progress data contradicts it"], "adaptable_boundaries": ["The diagnostic instrument", "How quickly re-placement happens once data indicates it"]}'::jsonb
      WHEN e->>'name' = 'High-dosage small group' THEN e || '{"look_fors": ["Sessions run daily, with attendance logged and missed sessions made up or noted", "Group size stays within the program''s specified maximum", "Instruction is explicit and student talk time is high, not adult explanation throughout"], "adaptable_boundaries": ["Time of day the group meets", "Who delivers it, provided they are trained in the program"]}'::jsonb
      WHEN e->>'name' = 'Frequent progress monitoring' THEN e || '{"look_fors": ["Progress measured weekly with dates recorded, not gathered retrospectively", "Data reviewed against a goal line, with a decision rule for when to change course", "Students see their own progress and can say whether they are gaining"], "adaptable_boundaries": ["The monitoring measure", "Whether review is individual or in a team meeting"]}'::jsonb
      WHEN e->>'name' = 'Cumulative review & practice' THEN e || '{"look_fors": ["Previously taught skills revisited in most sessions, not only new content", "Review is spaced across sessions rather than massed before an assessment", "Students retain earlier skills when they resurface, rather than relearning them"], "adaptable_boundaries": ["How review is distributed across the week", "Practice formats and materials"]}'::jsonb
      ELSE e
    END ORDER BY ord
  )
  FROM jsonb_array_elements(active_ingredients) WITH ORDINALITY AS t(e, ord)
)
WHERE name = 'Intensive Literacy Intervention'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(active_ingredients) x WHERE x ? 'look_fors'
  );
