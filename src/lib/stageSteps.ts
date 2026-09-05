export type StageKey = "decide" | "implement" | "sustain";
export type StepTier = "required" | "strengthens";

export interface StageStep {
  id: string;
  number: number;
  /** Plain-language title */
  title: string;
  /** Implementation-science name, shown as subtitle */
  label: string;
  /** One sentence on why this step matters */
  why: string;
  tier: StepTier;
}

export const DECIDE_STEPS: StageStep[] = [
  { id: "problem", number: 1, title: "What's the problem", label: "Problem Definition", why: "Name the student need you're solving, who it affects, and what the data shows now.", tier: "required" },
  { id: "team", number: 2, title: "Who decides and does the work", label: "Team Assembly", why: "Bring together a small team with the people who will lead, do, and measure the work.", tier: "required" },
  { id: "goals", number: 3, title: "What success looks like", label: "Goal Development", why: "Write goals you can measure and put a date on, so you'll know if it worked.", tier: "required" },
  { id: "solution", number: 4, title: "What we'll try", label: "Solution Selection", why: "Choose an approach with evidence behind it that fits your students and your setting.", tier: "required" },
  { id: "feasibility", number: 5, title: "Can we pull it off", label: "Readiness & Feasibility", why: "Check honestly: who has weighed in, what equity demands, and whether you have the capacity.", tier: "required" },
  { id: "metrics", number: 6, title: "How we'll measure it", label: "Success Metrics", why: "Pick the early signals and the final outcomes, and decide when you'll look.", tier: "required" },
];

export const IMPLEMENT_STEPS: StageStep[] = [
  { id: "training", number: 1, title: "Get the team ready", label: "Training & Coaching", why: "Make sure the people doing the practice have been trained and know the core ingredients.", tier: "required" },
  { id: "observe", number: 2, title: "Watch the practice happen", label: "Fidelity Observations", why: "Go see it. Log what you observe against the look-fors so you can tell fidelity from drift.", tier: "required" },
  { id: "pulse", number: 3, title: "Check in weekly", label: "Implementation Pulse & Commitments", why: "A two-minute weekly pulse plus the commitments it produces keeps small problems small.", tier: "strengthens" },
  { id: "improve", number: 4, title: "Test a change", label: "Improvement Cycles (PDSA)", why: "When something isn't working, run one small, time-boxed test instead of overhauling everything.", tier: "required" },
  { id: "review", number: 5, title: "Ready to sustain?", label: "Stage Review", why: "Confirm fidelity is holding and at least one improvement cycle has landed, then move on.", tier: "required" },
];

export const SUSTAIN_STEPS: StageStep[] = [
  { id: "routines", number: 1, title: "Make it routine", label: "Embedding Routines", why: "Put the practice on the calendar and in someone's job so it happens without a champion pushing.", tier: "required" },
  { id: "onboarding", number: 2, title: "Bring new staff up to speed", label: "Onboarding Resources", why: "Decide how a teacher who joins in January learns this practice.", tier: "strengthens" },
  { id: "protect", number: 3, title: "Protect the time and money", label: "Resource Protections", why: "Name what this needs to keep running and how you'll defend it when priorities shift.", tier: "required" },
  { id: "scale", number: 4, title: "Check it's ready to spread", label: "Scale Readiness", why: "Rate readiness honestly before taking it to more classrooms or schools.", tier: "strengthens" },
  { id: "decision", number: 5, title: "Decide: continue, scale, or stop", label: "Decision Point", why: "Look at the evidence and make the call. Every option is legitimate when the evidence supports it.", tier: "required" },
];

export const STAGE_STEPS: Record<StageKey, StageStep[]> = {
  decide: DECIDE_STEPS,
  implement: IMPLEMENT_STEPS,
  sustain: SUSTAIN_STEPS,
};

export interface StageProgress {
  completedSteps: number;
  totalSteps: number;
  requiredDone: number;
  requiredTotal: number;
  percent: number;
  isReady: boolean;
  nextStep: StageStep | null;
  missingRequired: StageStep[];
}

/** done: map of step id to whether it has content */
export function stageProgress(steps: StageStep[], done: Record<string, boolean>): StageProgress {
  const isDone = (s: StageStep) => !!done[s.id];
  const required = steps.filter((s) => s.tier === "required");
  const missingRequired = required.filter((s) => !isDone(s));
  const missingStrengthens = steps.filter((s) => s.tier === "strengthens" && !isDone(s));
  const completed = steps.filter(isDone).length;
  return {
    completedSteps: completed,
    totalSteps: steps.length,
    requiredDone: required.length - missingRequired.length,
    requiredTotal: required.length,
    percent: steps.length ? Math.round((completed / steps.length) * 100) : 0,
    isReady: missingRequired.length === 0,
    nextStep: missingRequired[0] ?? missingStrengthens[0] ?? null,
    missingRequired,
  };
}

export function stepById(steps: StageStep[], id: string | null | undefined): StageStep | undefined {
  return steps.find((s) => s.id === id);
}

export function stepByNumber(steps: StageStep[], n: number): StageStep | undefined {
  return steps.find((s) => s.number === n);
}
