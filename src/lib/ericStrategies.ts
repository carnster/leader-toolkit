// The ERIC strategy library, education-adapted, with each strategy tagged to its
// implementation phase from the Implementation Strategy Supplemental Tool (ISST).
// ERIC strategies: Powell et al. (2015); cluster assignments: Waltz et al. (2015).
// Phase tags: ISST (Phase 1 Planning, Phase 2 Early Implementation, Phase 3
// Implementation and Evaluation, Phase 4 Confirmation and Sustainability).
// Each strategy carries the EARLIEST phase a leader should reach for it, which is
// the cleanest "is this right for my stage now" signal; many strategies continue
// to be useful in later phases.
import type { EricCategory } from "@/lib/ericClusters";

export type EricPhase =
  | "planning"
  | "early_implementation"
  | "implementation_evaluation"
  | "confirmation_sustainability";

export interface EricPhaseMeta {
  label: string;
  order: number;
  /** App stages this phase maps to (initiative.stage values). */
  stages: string[];
  blurb: string;
}

export const ERIC_PHASES: Record<EricPhase, EricPhaseMeta> = {
  planning: { label: "Planning", order: 1, stages: ["decide", "plan"], blurb: "Set up the conditions: readiness, coalition, blueprint, commitments." },
  early_implementation: { label: "Early Implementation", order: 2, stages: ["implement"], blurb: "Launch the work: teams, early adopters, training, materials." },
  implementation_evaluation: { label: "Implementation & Evaluation", order: 3, stages: ["implement"], blurb: "Run and refine: coaching, data, feedback, adjustment." },
  confirmation_sustainability: { label: "Confirmation & Sustainability", order: 4, stages: ["sustain"], blurb: "Confirm and embed: capture what works, weave networks, sustain gains." },
};

/** The phases that are most relevant when an initiative is in a given stage. */
export function phasesForStage(stage: string | undefined | null): EricPhase[] {
  switch (stage) {
    case "decide":
    case "plan":
      return ["planning"];
    case "implement":
      return ["early_implementation", "implementation_evaluation"];
    case "sustain":
      return ["confirmation_sustainability"];
    default:
      return ["planning"];
  }
}

export interface ERICStrategy {
  id: string;
  name: string;
  definition: string;
  category: EricCategory;
  phase: EricPhase;
}

export const ERIC_STRATEGIES: ERICStrategy[] = [
  // Use evaluative and iterative strategies
  { id: "assess-readiness", name: "Assess for readiness; identify barriers and facilitators", definition: "Assess the school's readiness for change and identify what will help or hinder implementation", category: "evaluative_iterative", phase: "planning" },
  { id: "develop-formal-blueprint", name: "Develop a formal implementation blueprint", definition: "Create a formal plan with goals, strategies, scope, timeframe, and progress measures", category: "evaluative_iterative", phase: "planning" },
  { id: "quality-monitoring", name: "Develop and organize quality monitoring systems", definition: "Build systems and procedures that monitor implementation processes and outcomes", category: "evaluative_iterative", phase: "planning" },
  { id: "stage-scale-up", name: "Stage implementation scale up", definition: "Phase implementation by starting with small pilots or demonstration classrooms before expanding", category: "evaluative_iterative", phase: "planning" },
  { id: "conduct-small-tests", name: "Conduct cyclical small tests of change", definition: "Test changes with small PDSA cycles before taking them school- or system-wide", category: "evaluative_iterative", phase: "early_implementation" },
  { id: "audit-feedback", name: "Audit and provide feedback", definition: "Collect and summarize implementation data and share it with staff to monitor and improve practice", category: "evaluative_iterative", phase: "implementation_evaluation" },
  { id: "reexamine-implementation", name: "Purposely reexamine the implementation", definition: "Monitor progress and adjust practice and strategies to continuously improve quality", category: "evaluative_iterative", phase: "implementation_evaluation" },

  // Provide interactive assistance
  { id: "local-technical-assistance", name: "Provide local technical assistance", definition: "Develop and use a system to deliver hands-on assistance using local personnel", category: "provide_interactive_assistance", phase: "planning" },
  { id: "facilitation", name: "Facilitation", definition: "Interactive problem solving and support delivered in the context of a recognized need for improvement", category: "provide_interactive_assistance", phase: "early_implementation" },
  { id: "provide-supervision", name: "Provide instructional coaching and supervision", definition: "Give educators ongoing, practice-focused coaching centered on the new approach", category: "provide_interactive_assistance", phase: "implementation_evaluation" },

  // Adapt and tailor to context
  { id: "tailor-strategies", name: "Tailor strategies to local context", definition: "Choose and adapt implementation strategies to address the barriers and assets identified in your context", category: "adapt_practice", phase: "planning" },
  { id: "promote-adaptability", name: "Promote adaptability", definition: "Identify how the practice can be adapted to local needs while protecting its core active ingredients", category: "adapt_practice", phase: "early_implementation" },

  // Develop stakeholder relationships
  { id: "recruit-leadership", name: "Recruit, designate, and train for leadership", definition: "Recruit, designate, and train leaders for the change effort", category: "develop_stakeholder_relationships", phase: "planning" },
  { id: "build-coalition", name: "Build a coalition", definition: "Recruit and cultivate relationships with partners in the implementation effort", category: "develop_stakeholder_relationships", phase: "planning" },
  { id: "consensus-discussions", name: "Conduct local consensus discussions", definition: "Include staff in discussions to establish that the problem matters and the chosen approach is right", category: "develop_stakeholder_relationships", phase: "planning" },
  { id: "identify-champions", name: "Identify and prepare champions", definition: "Identify and prepare individuals who will dedicate themselves to supporting and driving the implementation", category: "develop_stakeholder_relationships", phase: "planning" },
  { id: "develop-partnerships", name: "Develop academic partnerships", definition: "Partner with universities or external experts for shared training and research support", category: "develop_stakeholder_relationships", phase: "planning" },
  { id: "early-adopters", name: "Identify early adopters", definition: "Learn from staff who adopt the practice first and use their experience to inform wider rollout", category: "develop_stakeholder_relationships", phase: "early_implementation" },
  { id: "implementation-teams", name: "Organize implementation team meetings", definition: "Develop teams of implementers with protected time to reflect on progress and support each other's learning", category: "develop_stakeholder_relationships", phase: "early_implementation" },

  // Train and educate
  { id: "educational-meetings", name: "Conduct educational meetings", definition: "Hold meetings targeted to different groups (teachers, leaders, families) to teach them about the practice", category: "train_educate", phase: "planning" },
  { id: "develop-materials", name: "Develop educational materials", definition: "Create manuals, toolkits, and supporting materials that make the practice easier to learn and use", category: "train_educate", phase: "planning" },
  { id: "conduct-training", name: "Conduct ongoing training", definition: "Plan for and deliver training on the new practice in an ongoing way, not as a one-off event", category: "train_educate", phase: "early_implementation" },
  { id: "dynamic-training", name: "Make training dynamic", definition: "Vary training methods, make them interactive, and tie them to real classroom practice", category: "train_educate", phase: "early_implementation" },
  { id: "learning-collaborative", name: "Create a learning collaborative", definition: "Form groups of educators who learn the practice together and hold each other accountable", category: "train_educate", phase: "early_implementation" },
  { id: "train-the-trainer", name: "Use train-the-trainer strategies", definition: "Train designated staff to train others in the practice, building internal capacity", category: "train_educate", phase: "implementation_evaluation" },

  // Support educators
  { id: "revise-roles", name: "Revise professional roles", definition: "Shift and clarify roles and responsibilities so the practice has protected time and clear ownership", category: "support_clinicians", phase: "planning" },
  { id: "create-teaching-teams", name: "Create new teaching teams", definition: "Change team composition, adding different skills and perspectives to support the practice", category: "support_clinicians", phase: "planning" },
  { id: "resource-sharing", name: "Develop resource sharing agreements", definition: "Partner with organizations that have resources the implementation needs", category: "support_clinicians", phase: "planning" },
  { id: "remind-practitioners", name: "Remind and prompt educators", definition: "Build in reminders and prompts that help staff use the practice consistently", category: "support_clinicians", phase: "implementation_evaluation" },

  // Engage students and families
  { id: "involve-students-families", name: "Involve students and families", definition: "Engage students and family members in design decisions, feedback, and implementation", category: "engage_consumers", phase: "early_implementation" },
  { id: "obtain-family-feedback", name: "Obtain and use student and family feedback", definition: "Develop ways to gather and act on student and family feedback on the implementation", category: "engage_consumers", phase: "implementation_evaluation" },
  { id: "prepare-active-participants", name: "Prepare students to be active participants", definition: "Equip students to understand and engage with the new practice rather than receive it passively", category: "engage_consumers", phase: "confirmation_sustainability" },

  // Use financial strategies
  { id: "access-funding", name: "Access new funding", definition: "Secure new or repurposed funding to enable and sustain the implementation", category: "use_financial_strategies", phase: "planning" },
  { id: "alter-incentives", name: "Alter incentive and recognition structures", definition: "Adjust how effort is recognized and rewarded to encourage adoption of the practice", category: "use_financial_strategies", phase: "early_implementation" },

  // Change infrastructure
  { id: "change-physical-structure", name: "Change physical structure and equipment", definition: "Adapt spaces, materials, and equipment to accommodate the new practice", category: "change_infrastructure", phase: "planning" },
  { id: "change-record-systems", name: "Change record systems", definition: "Update data and record systems to allow better assessment of implementation and outcomes", category: "change_infrastructure", phase: "planning" },
  { id: "change-schedules", name: "Change schedules and calendars", definition: "Restructure timetables, meeting schedules, and calendars so the practice has time to live in", category: "change_infrastructure", phase: "planning" },
  { id: "mandate-change", name: "Mandate change", definition: "Have leadership declare the priority of the practice and their determination to see it implemented", category: "change_infrastructure", phase: "early_implementation" },
  { id: "capture-share-knowledge", name: "Capture and share local knowledge", definition: "Capture how staff made the practice work in their setting and share it with other classrooms and sites", category: "change_infrastructure", phase: "confirmation_sustainability" },
];
