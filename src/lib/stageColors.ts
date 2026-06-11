// Stage identity colors for wayfinding. Each stage of the IMPACT journey has
// its own hue so moving between stages is visually unmistakable.
export interface StageColor {
  route: string;
  name: string;
  cssVar: string;
}

export const STAGE_COLORS: StageColor[] = [
  { route: "/decide", name: "Decide", cssVar: "--stage-decide" },
  { route: "/plan", name: "Plan & Prepare", cssVar: "--stage-plan" },
  { route: "/implement", name: "Implement", cssVar: "--stage-implement" },
  { route: "/sustain", name: "Spread & Sustain", cssVar: "--stage-sustain" },
];

export function stageColorFor(route: string): string | null {
  const stage = STAGE_COLORS.find((s) => s.route === route);
  return stage ? `hsl(var(${stage.cssVar}))` : null;
}

/** DB stage value → css var (monitor counts as implement; book model) */
export const STAGE_VALUE_VARS: Record<string, string> = {
  decide: "--stage-decide",
  plan: "--stage-plan",
  implement: "--stage-implement",
  monitor: "--stage-implement",
  sustain: "--stage-sustain",
};
