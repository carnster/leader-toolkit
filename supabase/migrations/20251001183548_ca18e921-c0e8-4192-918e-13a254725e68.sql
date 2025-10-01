-- Create initiative_templates table to power the Evidence-Based Initiatives selector
CREATE TABLE IF NOT EXISTS public.initiative_templates (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  evidence_base text,
  target_outcomes text[] NOT NULL DEFAULT '{}',
  typical_timeline text,
  resources_needed text[] DEFAULT '{}',
  active_ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_brief_template jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.initiative_templates ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'initiative_templates' 
      AND policyname = 'Templates are readable by all authenticated users'
  ) THEN
    CREATE POLICY "Templates are readable by all authenticated users"
    ON public.initiative_templates
    FOR SELECT
    USING (true);
  END IF;
END
$$;

-- Updated at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_initiative_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_initiative_templates_updated_at
    BEFORE UPDATE ON public.initiative_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END
$$;

-- Seed 5 templates (idempotent inserts)
INSERT INTO public.initiative_templates (name, category, description, evidence_base, target_outcomes, typical_timeline, resources_needed, active_ingredients, decision_brief_template)
SELECT * FROM (
  VALUES
  (
    'Structured Literacy Program',
    'Literacy',
    'Systematic, explicit instruction in phonemic awareness, phonics, fluency, vocabulary, and comprehension aligned to the science of reading.',
    'Strong evidence from meta-analyses (e.g., National Reading Panel, IES WWC) showing improved early decoding and long-term reading outcomes.',
    ARRAY['Improve decoding accuracy', 'Increase reading fluency', 'Boost comprehension on grade-level texts'],
    'Core implementation over 12–24 weeks with ongoing progress monitoring',
    ARRAY['Tiered materials set', 'Decodable texts', 'Screeners & progress monitors'],
    (
      '[
        {"name": "Explicit phonics routines", "description": "Daily, systematic instruction of sound-spelling patterns with cumulative review.", "is_core": true},
        {"name": "Phonemic awareness practice", "description": "Oral blending, segmenting, and manipulation activities.", "is_core": true},
        {"name": "Decodable text practice", "description": "Controlled texts aligned to taught patterns for fluency.", "is_core": true},
        {"name": "Error correction routine", "description": "Immediate corrective feedback with guided practice.", "is_core": true},
        {"name": "Vocabulary and background", "description": "Pre-teach key vocabulary and build knowledge.", "is_core": false}
      ]'
    )::jsonb,
    (
      '{
        "problem_statement": "Early readers show below-benchmark decoding and fluency.",
        "target_group": "K–2 students below benchmark on universal screening.",
        "measurement_timeline": "Every 2–3 weeks using CBM measures.",
        "leading_indicators": ["Lesson completion fidelity", "Weekly word reading accuracy"],
        "lagging_indicators": ["DIBELS/Acadience composite score", "Reading comprehension"]
      }'
    )::jsonb
  ),
  (
    'PBIS (Positive Behavioral Interventions and Supports)',
    'Behavior',
    'A multi-tiered framework emphasizing proactive strategies for defining, teaching, and supporting appropriate student behaviors.',
    'Extensive evidence across hundreds of schools showing reductions in office discipline referrals and improvements in climate.',
    ARRAY['Reduce office discipline referrals', 'Increase instructional time', 'Improve school climate'],
    'School-wide rollout over 6–12 months with continuous data cycles',
    ARRAY['Behavior matrix posters', 'Acknowledgement system', 'Referral data tracker'],
    (
      '[
        {"name": "Behavior expectations matrix", "description": "Define 3–5 positively stated expectations across settings.", "is_core": true},
        {"name": "Explicit teaching of expectations", "description": "Direct instruction and practice of expected behaviors.", "is_core": true},
        {"name": "Acknowledgement system", "description": "Consistent reinforcement of expected behaviors.", "is_core": true},
        {"name": "Data-based problem solving", "description": "Monthly review of ODRs to target supports.", "is_core": true},
        {"name": "Classroom routines & corrections", "description": "Active supervision, precorrections, and calm responses.", "is_core": false}
      ]'
    )::jsonb,
    (
      '{
        "problem_statement": "High ODR rates reduce instructional time.",
        "target_group": "All students (Tier 1), with Tier 2 supports as needed.",
        "measurement_timeline": "Monthly ODR review; quarterly climate surveys.",
        "leading_indicators": ["Tickets issued per week", "Lesson delivery rate"],
        "lagging_indicators": ["ODR per 100 students", "Suspension rates"]
      }'
    )::jsonb
  ),
  (
    'MTSS/RTI Framework',
    'Framework',
    'Tiered system providing increasing levels of support matched to student need using screening, progress monitoring, and data-based decision making.',
    'Strong evidence for improved outcomes when high-quality core instruction, screening, and targeted interventions are implemented with fidelity.',
    ARRAY['Improve universal screening coverage', 'Increase responsiveness to interventions', 'Reduce special education referrals'],
    'Establish within a semester; refine continuously through data cycles',
    ARRAY['Screening tools', 'Progress monitoring probes', 'Intervention menu'],
    (
      '[
        {"name": "Universal screening", "description": "At least 3x/year with high coverage.", "is_core": true},
        {"name": "Tiered intervention menu", "description": "Evidence-based options matched to need.", "is_core": true},
        {"name": "Data meetings", "description": "Regular team review and instructional adjustments.", "is_core": true},
        {"name": "Progress monitoring", "description": "Weekly or biweekly measures to track growth.", "is_core": true},
        {"name": "Check & adjust", "description": "Fidelity checks and refinements.", "is_core": false}
      ]'
    )::jsonb,
    (
      '{
        "problem_statement": "Inconsistent response to interventions across grades.",
        "target_group": "Students identified via screening and PM data.",
        "measurement_timeline": "Every 4–6 weeks in MTSS meetings.",
        "leading_indicators": ["PM completion rate", "Intervention dosage"],
        "lagging_indicators": ["Growth percentile", "Referral rates"]
      }'
    )::jsonb
  ),
  (
    'Second Step Social-Emotional Learning',
    'SEL',
    'A structured SEL curriculum building self-management, relationship skills, and responsible decision-making.',
    'Multiple randomized trials report improvements in prosocial behavior and reductions in problem behavior.',
    ARRAY['Increase prosocial behaviors', 'Improve self-regulation', 'Reduce disruptive incidents'],
    'Weekly lessons over 20–30 weeks with embedded practice',
    ARRAY['Lesson kits', 'Family engagement letters', 'Implementation guide'],
    (
      '[
        {"name": "Weekly explicit SEL lessons", "description": "Scripted lessons with modeling and practice.", "is_core": true},
        {"name": "Embedded practice routines", "description": "Daily prompts to generalize skills.", "is_core": true},
        {"name": "Reinforcement & reflection", "description": "Acknowledge use of SEL skills; student reflection.", "is_core": true},
        {"name": "Family connection", "description": "Send home practice activities.", "is_core": false}
      ]'
    )::jsonb,
    (
      '{
        "problem_statement": "Students struggle with self-regulation and peer conflict.",
        "target_group": "All students with targeted supports for some.",
        "measurement_timeline": "Monthly behavior dashboards; quarterly surveys.",
        "leading_indicators": ["Lesson completion", "Teacher-reported use"],
        "lagging_indicators": ["Incident rates", "Prosocial behavior ratings"]
      }'
    )::jsonb
  ),
  (
    'Intensive Literacy Intervention',
    'Intervention',
    'High-dosage, small-group or 1:1 intervention focusing on decoding, fluency, and comprehension for students significantly below grade level.',
    'Evidence from targeted intervention studies shows accelerated growth when delivered with sufficient intensity and fidelity.',
    ARRAY['Accelerate reading growth', 'Close skill gaps', 'Improve comprehension'],
    'Daily 30–45 minute sessions for 12–24 weeks',
    ARRAY['Intervention materials', 'Progress monitoring tools', 'Training & coaching'],
    (
      '[
        {"name": "Diagnostic placement", "description": "Pinpoint skill deficits to target instruction.", "is_core": true},
        {"name": "High-dosage small group", "description": "Daily sessions with explicit instruction.", "is_core": true},
        {"name": "Cumulative review & practice", "description": "Spiral practice to solidify learning.", "is_core": true},
        {"name": "Frequent progress monitoring", "description": "Weekly tracking to adjust instruction.", "is_core": true}
      ]'
    )::jsonb,
    (
      '{
        "problem_statement": "Persistent reading deficits despite core instruction.",
        "target_group": "Students >1.5 SD below benchmark.",
        "measurement_timeline": "Weekly PM; 6–8 week formal reviews.",
        "leading_indicators": ["Attendance", "Lesson completion", "Words correct per minute"],
        "lagging_indicators": ["Standardized reading scores", "Grade-level comprehension"]
      }'
    )::jsonb
  )
) AS v(name, category, description, evidence_base, target_outcomes, typical_timeline, resources_needed, active_ingredients, decision_brief_template)
WHERE NOT EXISTS (
  SELECT 1 FROM public.initiative_templates t WHERE t.name = v.name
);
