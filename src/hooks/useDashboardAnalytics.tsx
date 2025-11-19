import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalInitiatives: number;
  activeInitiatives: number;
  avgFidelityScore: number;
  totalTeamMembers: number;
  upcomingDeadlines: number;
  completedMilestones: number;
  totalMilestones: number;
  onTrackInitiatives: number;
  atRiskInitiatives: number;
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ["dashboardAnalytics"],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch initiatives
      const { data: initiatives, error: initiativesError } = await supabase
        .from("initiatives")
        .select("id, status, stage")
        .or(`owner_id.eq.${user.id},id.in.(select initiative_id from initiative_team_members where user_id = ${user.id})`);

      if (initiativesError) throw initiativesError;

      const initiativeIds = initiatives?.map(i => i.id) || [];

      // Fetch fidelity logs for average score
      const { data: fidelityLogs } = await supabase
        .from("fidelity_logs")
        .select("rating")
        .in("initiative_id", initiativeIds);

      const avgFidelity = fidelityLogs && fidelityLogs.length > 0
        ? fidelityLogs.reduce((sum, log) => sum + log.rating, 0) / fidelityLogs.length
        : 0;

      // Fetch team members count (unique across all initiatives)
      const { data: teamMembers } = await supabase
        .from("initiative_team_members")
        .select("user_id")
        .in("initiative_id", initiativeIds);

      const uniqueTeamMembers = new Set(teamMembers?.map(tm => tm.user_id) || []);

      // Fetch milestones
      const { data: milestones } = await supabase
        .from("timeline_milestones")
        .select("status, target_date")
        .in("initiative_id", initiativeIds);

      const completedMilestones = milestones?.filter(m => m.status === "completed").length || 0;
      const totalMilestones = milestones?.length || 0;

      // Calculate upcoming deadlines (within next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const upcomingDeadlines = milestones?.filter(m => {
        if (!m.target_date || m.status === "completed") return false;
        const targetDate = new Date(m.target_date);
        return targetDate <= sevenDaysFromNow && targetDate >= new Date();
      }).length || 0;

      // Fetch decision briefs to assess initiative health
      const { data: decisionBriefs } = await supabase
        .from("decision_briefs")
        .select("feasibility_score, checklist_completed, initiative_id")
        .in("initiative_id", initiativeIds);

      // Calculate at-risk initiatives (low feasibility or incomplete checklist)
      const atRiskCount = decisionBriefs?.filter(db => 
        (db.feasibility_score && db.feasibility_score < 60) || !db.checklist_completed
      ).length || 0;

      return {
        totalInitiatives: initiatives?.length || 0,
        activeInitiatives: initiatives?.filter(i => i.status === "active").length || 0,
        avgFidelityScore: Math.round(avgFidelity * 10) / 10,
        totalTeamMembers: uniqueTeamMembers.size,
        upcomingDeadlines,
        completedMilestones,
        totalMilestones,
        onTrackInitiatives: (initiatives?.length || 0) - atRiskCount,
        atRiskInitiatives: atRiskCount,
      };
    },
  });
}
