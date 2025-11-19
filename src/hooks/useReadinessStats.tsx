import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReadinessStats {
  initiativeId: string;
  initiativeTitle: string;
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
}

const READINESS_ITEMS = [
  "ingredients",
  "strategies",
  "team-assembled",
  "timeline",
  "risks",
  "pd-plan",
  "fidelity",
  "communication",
  "resources-secured",
  "training-complete",
  "buy-in",
  "adaptation-protocol"
];

export function useReadinessStats() {
  return useQuery({
    queryKey: ["readinessStats"],
    queryFn: async (): Promise<ReadinessStats[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch initiatives
      const { data: initiatives, error: initiativesError } = await supabase
        .from("initiatives")
        .select("id, title")
        .or(`owner_id.eq.${user.id},id.in.(select initiative_id from initiative_team_members where user_id = ${user.id})`)
        .eq("status", "active");

      if (initiativesError) throw initiativesError;

      const stats: ReadinessStats[] = [];

      for (const initiative of initiatives || []) {
        let completedCount = 0;

        // Check active ingredients
        const { data: ingredients } = await supabase
          .from("active_ingredients")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (ingredients && ingredients.length > 0) completedCount++;

        // Check implementation strategies
        const { data: strategies } = await supabase
          .from("implementation_strategies")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (strategies && strategies.length > 0) completedCount++;

        // Check team members
        const { data: team } = await supabase
          .from("initiative_team_members")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (team && team.length > 0) completedCount++;

        // Check timeline milestones
        const { data: milestones } = await supabase
          .from("timeline_milestones")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (milestones && milestones.length > 0) completedCount++;

        // Check risks
        const { data: risks } = await supabase
          .from("implementation_risks")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (risks && risks.length > 0) completedCount++;

        // Check PD activities
        const { data: pdActivities } = await supabase
          .from("pd_activities")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (pdActivities && pdActivities.length > 0) completedCount++;

        // Check fidelity checklists
        const { data: checklists } = await supabase
          .from("fidelity_checklists")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (checklists && checklists.length > 0) completedCount++;

        // Check communication activities
        const { data: communication } = await supabase
          .from("communication_activities")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (communication && communication.length > 0) completedCount++;

        // Check budget items
        const { data: budget } = await supabase
          .from("budget_items")
          .select("id")
          .eq("initiative_id", initiative.id)
          .limit(1);
        if (budget && budget.length > 0) completedCount++;

        // Check decision brief completion
        const { data: decisionBrief } = await supabase
          .from("decision_briefs")
          .select("checklist_completed")
          .eq("initiative_id", initiative.id)
          .single();
        if (decisionBrief?.checklist_completed) completedCount += 3; // Represents multiple sub-items

        stats.push({
          initiativeId: initiative.id,
          initiativeTitle: initiative.title,
          totalItems: READINESS_ITEMS.length,
          completedItems: completedCount,
          completionPercentage: Math.round((completedCount / READINESS_ITEMS.length) * 100),
        });
      }

      return stats;
    },
  });
}
