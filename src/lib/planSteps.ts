import type { CompletionCounts } from "@/lib/planProgress";

export type PlanTier = "required" | "strengthens";

export type PlanStepId =
  | "ingredients"
  | "strategies"
  | "team"
  | "pd"
  | "communication"
  | "timeline"
  | "risks"
  | "resources"
  | "fidelity"
  | "adaptation";

/** Counts the Plan page already computes, plus the two Quality Assurance signals. */
export interface PlanCounts extends CompletionCounts {
  /** fidelity_checklists + observation_schedules for this initiative */
  fidelity: number;
  /** adaptable ingredients that have at least one adaptable_boundaries entry */
  adaptation: number;
}

export interface PlanStep {
  id: PlanStepId;
  number: number;
  /** Plain-language title a first-time school leader understands */
  title: string;
  /** The implementation-science name, shown as a subtitle */
  label: string;
  /** One sentence: why this step matters */
  why: string;
  tier: PlanTier;
  /** Which count on PlanCounts marks this step complete */
  countKey: keyof PlanCounts;
  /** Coach nudge shown under the step; receives live counts */
  nudge: (counts: PlanCounts) => string;
}

export const PLAN_STEPS: PlanStep[] = [
  {
    id: "ingredients",
    number: 1,
    title: "What you're implementing",
    label: "Active Ingredients",
    why: "Name the specific practices that must happen for this to work. Everything else in the plan hangs on these.",
    tier: "required",
    countKey: "ingredients",
    nudge: (c) =>
      c.ingredients === 0
        ? "Start with 3 to 6 practices. Mark the ones that must stay as designed as core, and the ones that can flex as adaptable."
        : `You've named ${c.ingredients} ingredient${c.ingredients === 1 ? "" : "s"}. Check that each core one has look-fors, the observable evidence you'd see in a visit. Then continue to strategies.`,
  },
  {
    id: "strategies",
    number: 2,
    title: "How you'll put it in place",
    label: "Implementation Strategies",
    why: "Pick 3 to 5 research-backed methods, like training, coaching, and reminders, that get people actually doing the practices.",
    tier: "required",
    countKey: "strategies",
    nudge: (c) =>
      c.strategies === 0
        ? "Most teams need one strategy for learning the practice, one for support while doing it, and one for keeping it visible. Three to five is the sweet spot."
        : c.strategies > 5
        ? `You have ${c.strategies} strategies. That is more than most teams can run well. Consider trimming to the 3 to 5 that matter most.`
        : `${c.strategies} strateg${c.strategies === 1 ? "y" : "ies"} chosen. Next, name who will do this work.`,
  },
  {
    id: "team",
    number: 3,
    title: "Who does the work",
    label: "Team Members",
    why: "Name the people who own this and how much time they realistically have.",
    tier: "required",
    countKey: "team",
    nudge: (c) =>
      c.team === 0
        ? "Add a lead, the people who will do the practice, and someone who can look at data. Small and clear beats big and vague."
        : `${c.team} team member${c.team === 1 ? "" : "s"} listed. Next, plan how they will learn the practice.`,
  },
  {
    id: "pd",
    number: 4,
    title: "How people learn it",
    label: "Professional Development",
    why: "Plan the training and coaching your team needs before day one and during the first months.",
    tier: "required",
    countKey: "pd",
    nudge: (c) =>
      c.pd === 0
        ? "One initial training rarely sticks. Plan the first session plus at least one coaching or practice touchpoint afterward."
        : `${c.pd} learning activit${c.pd === 1 ? "y" : "ies"} planned. Next, decide who needs to hear about this change.`,
  },
  {
    id: "communication",
    number: 5,
    title: "Who needs to know",
    label: "Communication Plan",
    why: "Decide how staff, families, and partners hear about the change and where they can ask questions.",
    tier: "strengthens",
    countKey: "communication",
    nudge: (c) =>
      c.communication === 0
        ? "This step strengthens your plan but does not block it. Even one message to staff and one to families prevents surprises later."
        : `${c.communication} communication activit${c.communication === 1 ? "y" : "ies"} planned. Next, set your timeline.`,
  },
  {
    id: "timeline",
    number: 6,
    title: "When it happens",
    label: "Timeline & Milestones",
    why: "Set milestones so you can see whether the rollout is on track, not just whether it started.",
    tier: "required",
    countKey: "timeline",
    nudge: (c) =>
      c.timeline === 0
        ? "Three milestones are enough to start: when training is done, when the practice is happening in every room, and when you'll review the first data."
        : `${c.timeline} milestone${c.timeline === 1 ? "" : "s"} set. Next, name what could get in the way.`,
  },
  {
    id: "risks",
    number: 7,
    title: "What could get in the way",
    label: "Risk Management",
    why: "Name the likely obstacles now and decide what you'll do if they show up.",
    tier: "required",
    countKey: "risks",
    nudge: (c) =>
      c.risks === 0
        ? "Staff turnover, competing priorities, and time are the usual three. Write one line on what you'd do for each."
        : `${c.risks} risk${c.risks === 1 ? "" : "s"} identified. Next, list what this needs in budget, materials, and time.`,
  },
  {
    id: "resources",
    number: 8,
    title: "What it costs",
    label: "Resource Allocation",
    why: "List the budget, materials, and time this needs so nothing stalls for lack of resources.",
    tier: "strengthens",
    countKey: "budget",
    nudge: (c) =>
      c.budget === 0
        ? "This step strengthens your plan but does not block it. Even a rough list of costs helps you protect the work later."
        : `${c.budget} resource item${c.budget === 1 ? "" : "s"} listed. Next, decide how you'll know it's working.`,
  },
  {
    id: "fidelity",
    number: 9,
    title: "How you'll know it's working",
    label: "Fidelity Monitoring",
    why: "Choose what you'll look for and how often, so you can tell fidelity from drift early.",
    tier: "required",
    countKey: "fidelity",
    nudge: (c) =>
      c.fidelity === 0
        ? "Build one checklist from your core ingredients' look-fors and set a simple observation rhythm. Monthly is fine to start."
        : "Monitoring is set up. Last step: decide how much can flex, then review your readiness.",
  },
  {
    id: "adaptation",
    number: 10,
    title: "How much can flex",
    label: "Adaptation Protocol",
    why: "Set boundaries for what teachers can change locally and what must stay as designed.",
    tier: "strengthens",
    countKey: "adaptation",
    nudge: (c) =>
      c.adaptation === 0
        ? "This step strengthens your plan but does not block it. Add adaptation boundaries to your adaptable ingredients when you're ready."
        : "Boundaries are documented. Head to the overview to check your readiness and move to Implement.",
  },
];

export const TOTAL_STEPS = PLAN_STEPS.length;
export const REQUIRED_STEPS = PLAN_STEPS.filter((s) => s.tier === "required");

export function isStepComplete(step: PlanStep, counts: PlanCounts): boolean {
  return (counts[step.countKey] ?? 0) > 0;
}

export interface PlanProgress {
  completedSteps: number;
  totalSteps: number;
  requiredDone: number;
  requiredTotal: number;
  /** completedSteps / totalSteps, rounded */
  percent: number;
  /** all required steps complete */
  isReady: boolean;
  /** first incomplete required step, else first incomplete strengthens step, else null */
  nextStep: PlanStep | null;
  /** required steps still missing, in order */
  missingRequired: PlanStep[];
  /** strengthens steps still missing, in order */
  missingStrengthens: PlanStep[];
}

export function getPlanProgress(counts: PlanCounts): PlanProgress {
  const completed = PLAN_STEPS.filter((s) => isStepComplete(s, counts));
  const missingRequired = REQUIRED_STEPS.filter((s) => !isStepComplete(s, counts));
  const missingStrengthens = PLAN_STEPS.filter(
    (s) => s.tier === "strengthens" && !isStepComplete(s, counts)
  );
  const requiredDone = REQUIRED_STEPS.length - missingRequired.length;
  return {
    completedSteps: completed.length,
    totalSteps: TOTAL_STEPS,
    requiredDone,
    requiredTotal: REQUIRED_STEPS.length,
    percent: Math.round((completed.length / TOTAL_STEPS) * 100),
    isReady: missingRequired.length === 0,
    nextStep: missingRequired[0] ?? missingStrengthens[0] ?? null,
    missingRequired,
    missingStrengthens,
  };
}

export function stepForSection(section: string | null | undefined): PlanStep | undefined {
  return PLAN_STEPS.find((s) => s.id === section);
}

export function stepByNumber(n: number): PlanStep | undefined {
  return PLAN_STEPS.find((s) => s.number === n);
}
