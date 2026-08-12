// A blameless, diagnostic read on what is getting in the way when a practice is
// not showing up yet. Adapted from the Theoretical Domains Framework, restated in
// plain language. Source: The Center for Implementation, 2026 (a practitioner
// bulletin, not peer-reviewed; label it as such anywhere it is surfaced to users).
//
// These are stored verbatim in fidelity_logs.barrier_domain (a nullable text
// column), so the labels double as the persisted values. Optional by design.
export const BARRIER_DOMAINS: string[] = [
  "Knowledge",
  "Skills",
  "Memory or attention load",
  "Habits",
  "Confidence",
  "Role or identity",
  "Beliefs about consequences",
  "Emotions",
  "Influenced by others",
  "Time or resources",
  "Physical environment",
];
