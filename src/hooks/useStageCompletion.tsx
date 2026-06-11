import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StageStatus = "complete" | "in_progress" | "not_started";

export interface StageCompletion {
  decide: StageStatus;
  plan: StageStatus;
  implement: StageStatus;
  sustain: StageStatus;
  /** Short human description of what remains, per stage */
  remaining: Record<"decide" | "plan" | "implement" | "sustain", string>;
}

const count = async (table: string, initiativeId: string): Promise<number> => {
  const { count: c } = await supabase
    .from(table as any)
    .select("id", { count: "exact", head: true })
    .eq("initiative_id", initiativeId);
  return c ?? 0;
};

export function useStageCompletion(initiativeId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["stage-completion", initiativeId],
    enabled: !!initiativeId,
    staleTime: 30_000,
    queryFn: async (): Promise<StageCompletion> => {
      const id = initiativeId!;
      const [{ data: brief }, ingredients, strategies, team, milestones, risks, pd, fidelity, pdsa, { data: sustainPlan }] =
        await Promise.all([
          supabase.from("decision_briefs").select("checklist_completed, problem_statement").eq("initiative_id", id).maybeSingle(),
          count("active_ingredients", id),
          count("implementation_strategies", id),
          count("initiative_team_members", id),
          count("timeline_milestones", id),
          count("implementation_risks", id),
          count("pd_activities", id),
          count("fidelity_logs", id),
          count("pdsa_cycles", id),
          supabase.from("sustainability_plans").select("next_steps, embedding_routines").eq("initiative_id", id).maybeSingle(),
        ]);

      const decide: StageStatus = brief?.checklist_completed
        ? "complete"
        : brief?.problem_statement
        ? "in_progress"
        : "not_started";

      const planParts = [ingredients, strategies, team, milestones, risks, pd];
      const planDone = planParts.filter((n) => n > 0).length;
      const plan: StageStatus = planDone === 6 ? "complete" : planDone > 0 ? "in_progress" : "not_started";

      const implement: StageStatus =
        fidelity > 0 && pdsa > 0 ? "complete" : fidelity > 0 || pdsa > 0 ? "in_progress" : "not_started";

      const sustainRoutines = ((sustainPlan?.embedding_routines as any[]) || []).length;
      const sustain: StageStatus = sustainPlan?.next_steps
        ? "complete"
        : sustainRoutines > 0
        ? "in_progress"
        : "not_started";

      const planMissing = [
        ingredients === 0 && "active ingredients",
        strategies === 0 && "strategies",
        team === 0 && "team",
        milestones === 0 && "timeline",
        risks === 0 && "risks",
        pd === 0 && "PD",
      ].filter(Boolean);

      return {
        decide,
        plan,
        implement,
        sustain,
        remaining: {
          decide: decide === "complete" ? "Complete" : brief?.problem_statement ? "Finish the 6-step Decision Brief" : "Start: define the problem",
          plan: plan === "complete" ? "Complete" : planMissing.length ? `Still needed: ${planMissing.join(", ")}` : "Start: build the plan",
          implement: implement === "complete" ? "Observations and improvement cycles running" : fidelity > 0 ? "Run your first PDSA cycle" : "Start: log a fidelity observation",
          sustain: sustain === "complete" ? "Decision recorded" : sustainRoutines > 0 ? "Record the continue/scale/stop decision" : "Start: embed routines",
        },
      };
    },
  });
  return data;
}
