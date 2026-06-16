import { Badge } from "@/components/ui/badge";
import { ericLabel } from "@/lib/ericClusters";
import { ERIC_PHASES, ERIC_STRATEGIES, type EricPhase } from "@/lib/ericStrategies";
import type { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import { CalendarRange, ArrowRight } from "lucide-react";

// Each phase column maps to the stage where the leader deploys it, and borrows
// that stage's identity color so the arc reads left to right like the journey.
const PHASE_ORDER: EricPhase[] = [
  "planning",
  "early_implementation",
  "implementation_evaluation",
  "confirmation_sustainability",
];
const PHASE_STAGE: Record<EricPhase, { stage: string; cssVar: string }> = {
  planning: { stage: "Decide & Plan", cssVar: "--stage-plan" },
  early_implementation: { stage: "Implement (early)", cssVar: "--stage-implement" },
  implementation_evaluation: { stage: "Implement", cssVar: "--stage-implement" },
  confirmation_sustainability: { stage: "Spread & Sustain", cssVar: "--stage-sustain" },
};

// Best-effort phase for strategies that predate phase tagging or were added
// manually: use the stored phase, else match the name against the ERIC library.
const NAME_TO_PHASE = new Map(ERIC_STRATEGIES.map((s) => [s.name.toLowerCase(), s.phase]));
function resolvePhase(s: ImplementationStrategy): EricPhase | null {
  const stored = s.implementation_phase as EricPhase | null;
  if (stored && stored in ERIC_PHASES) return stored;
  const matched = NAME_TO_PHASE.get((s.strategy_name || "").toLowerCase());
  return matched ?? null;
}

const STATUS_DOT: Record<string, string> = {
  completed: "bg-[hsl(var(--stage-sustain))]",
  in_progress: "bg-[hsl(var(--stage-plan))]",
  planned: "bg-muted-foreground/40",
  on_hold: "bg-destructive/60",
};

function StrategyChip({ s }: { s: ImplementationStrategy }) {
  return (
    <div className="rounded-md border bg-card p-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[s.status] || STATUS_DOT.planned}`}
          aria-hidden="true"
        />
        <p className="text-sm font-medium leading-snug">{s.strategy_name}</p>
      </div>
      <Badge variant="outline" className="text-[10px] ml-4">
        {ericLabel(s.eric_category)}
      </Badge>
    </div>
  );
}

interface StrategyTimelineProps {
  strategies: ImplementationStrategy[];
}

export function StrategyTimeline({ strategies }: StrategyTimelineProps) {
  const byPhase: Record<EricPhase, ImplementationStrategy[]> = {
    planning: [],
    early_implementation: [],
    implementation_evaluation: [],
    confirmation_sustainability: [],
  };
  const anytime: ImplementationStrategy[] = [];
  for (const s of strategies) {
    const p = resolvePhase(s);
    if (p) byPhase[p].push(s);
    else anytime.push(s);
  }

  if (strategies.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <CalendarRange className="h-8 w-8 text-muted-foreground mx-auto" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No strategies yet to lay across the timeline.</p>
        <p className="text-xs text-muted-foreground">
          Generate AI recommendations or add strategies, and they will appear here on the phase they belong to.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
        Your strategies across the implementation arc. Each column is the phase when the work is most useful.
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {PHASE_ORDER.map((phase, i) => {
          const meta = ERIC_PHASES[phase];
          const stage = PHASE_STAGE[phase];
          const items = byPhase[phase];
          return (
            <div key={phase} className="relative rounded-lg border bg-muted/30 overflow-hidden">
              <div
                className="h-1 w-full"
                style={{ backgroundColor: `hsl(var(${stage.cssVar}))` }}
                aria-hidden="true"
              />
              <div className="p-3 space-y-2">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{meta.label}</h4>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{stage.stage}</p>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nothing planned here yet.</p>
                  ) : (
                    items.map((s) => <StrategyChip key={s.id} s={s} />)
                  )}
                </div>
              </div>
              {i < PHASE_ORDER.length - 1 && (
                <ArrowRight
                  className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 z-10"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {anytime.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Anytime / Ongoing</h4>
            <span className="text-xs text-muted-foreground">{anytime.length}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Not tied to one phase, or added without a phase. These run as needed across the work.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {anytime.map((s) => <StrategyChip key={s.id} s={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
