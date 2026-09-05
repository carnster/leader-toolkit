import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LearningPlanSession {
  title: string;
  initiatives: string[];
  capability: string;
  modality: string;
  audience: string;
  cadence?: string;
  rationale?: string;
  locked?: boolean;
}
export interface LearningPlanPeriod {
  label: string;
  timeframe: string;
  focus: string;
  sessions: LearningPlanSession[];
}
export interface LearningPlanData {
  overview: string;
  themes?: string[];
  periods: LearningPlanPeriod[];
  coordination_notes: string[];
}
export interface LearningPlan {
  id: string;
  title: string;
  scope: "single" | "all";
  initiative_ids: string[];
  school_year_start: string | null;
  plan_data: LearningPlanData;
  created_at: string;
  updated_at: string;
}

interface GenerateInput {
  scope: "single" | "all";
  initiativeIds: string[];
  schoolYearStart: string;
  /** The currently displayed plan's data, if this is a rebuild. Sessions the
   *  leader has locked (edited) are preserved into the freshly generated plan. */
  previousPlanData?: LearningPlanData;
}

/** Carries forward any locked (leader-edited) sessions from the previous plan
 *  into the newly generated one, so a rebuild never silently discards an edit.
 *  A locked session replaces a same-titled session in its target period, or is
 *  appended to that period (falling back to the first period) if no match is found. */
export function mergeLockedSessions(prev: LearningPlanData | undefined, next: LearningPlanData): LearningPlanData {
  if (!prev) return next;
  const locked = prev.periods.flatMap((p) => p.sessions.filter((s) => s.locked).map((s) => ({ periodLabel: p.label, session: s })));
  if (locked.length === 0) return next;
  const periods = next.periods.map((p) => ({ ...p, sessions: [...p.sessions] }));
  for (const { periodLabel, session } of locked) {
    const target = periods.find((p) => p.label === periodLabel) ?? periods[0];
    if (!target) continue;
    const dup = target.sessions.findIndex((s) => s.title.trim().toLowerCase() === session.title.trim().toLowerCase());
    if (dup >= 0) target.sessions[dup] = session; else target.sessions.push(session);
  }
  return { ...next, periods };
}

async function assembleInitiative(id: string) {
  const [init, brief, ingredients, strategies, pd] = await Promise.all([
    supabase.from("initiatives").select("title, stage").eq("id", id).maybeSingle(),
    supabase.from("decision_briefs").select("problem_statement, goals, target_group").eq("initiative_id", id).maybeSingle(),
    supabase.from("active_ingredients").select("name, is_core, look_fors").eq("initiative_id", id),
    supabase.from("implementation_strategies").select("strategy_name, eric_category, implementation_phase").eq("initiative_id", id),
    supabase.from("pd_activities").select("title, activity_type").eq("initiative_id", id),
  ]);
  return {
    title: init.data?.title || "Initiative",
    stage: init.data?.stage || null,
    problem_statement: brief.data?.problem_statement || null,
    goals: brief.data?.goals || null,
    target_group: brief.data?.target_group || null,
    active_ingredients: ingredients.data || [],
    strategies: strategies.data || [],
    pd_activities: pd.data || [],
  };
}

export function useLearningPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["learning-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_plans" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as LearningPlan[]) || [];
    },
  });

  const generate = useMutation({
    mutationFn: async ({ scope, initiativeIds, schoolYearStart, previousPlanData }: GenerateInput) => {
      if (initiativeIds.length === 0) throw new Error("Select at least one initiative.");
      const initiatives = await Promise.all(initiativeIds.map(assembleInitiative));

      const { data, error } = await supabase.functions.invoke("synthesize-learning-plan", {
        body: { schoolYearStart, initiatives },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const plan = data?.plan;
      if (!plan?.periods) throw new Error("The plan came back empty. Please try again.");

      const title =
        scope === "single"
          ? `${initiatives[0].title}: Professional Learning Plan`
          : `Professional Learning Plan, ${schoolYearStart}`;

      const mergedPlan = mergeLockedSessions(previousPlanData, plan);

      const { data: saved, error: saveError } = await supabase
        .from("learning_plans" as any)
        .insert({
          title,
          scope,
          initiative_ids: initiativeIds,
          school_year_start: schoolYearStart,
          plan_data: mergedPlan,
        })
        .select()
        .single();
      if (saveError) throw saveError;
      return saved as unknown as LearningPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-plans"] });
      toast({ title: "Learning plan ready", description: "Your year of professional learning is synthesized and saved." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not build the plan", description: e.message, variant: "destructive" }),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, plan_data }: { id: string; plan_data: LearningPlanData }) => {
      const { data, error } = await supabase
        .from("learning_plans" as any)
        .update({ plan_data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LearningPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-plans"] });
      toast({ title: "Plan updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Could not update the plan", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("learning_plans" as any).delete().eq("id", id).select();
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0)
        throw new Error("Only the owner can delete this plan.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-plans"] });
      toast({ title: "Plan deleted" });
    },
    onError: (e: Error) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  return {
    plans: plans || [],
    isLoading,
    generate: generate.mutateAsync,
    isGenerating: generate.isPending,
    updatePlan: updatePlan.mutateAsync,
    isUpdating: updatePlan.isPending,
    remove: remove.mutate,
  };
}
