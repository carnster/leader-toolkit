import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseDateOnly } from "@/lib/dates";
import { useOrganization } from "@/hooks/useOrganization";

export interface InitiativeHealthRow {
  id: string;
  title: string;
  atRisk: boolean;
}

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
  initiativeHealth: InitiativeHealthRow[];
}

export function useDashboardAnalytics(initiativeId?: string) {
  // The network administrator's "Acting on" school scopes the dashboard to
  // that school, agreeing with the initiative switcher and lists; everyone
  // else queries exactly as before.
  const { isNetworkLeader, actingOrgId } = useOrganization();

  return useQuery({
    queryKey: isNetworkLeader
      ? ["dashboardAnalytics", initiativeId, actingOrgId]
      : ["dashboardAnalytics", initiativeId],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build query
      let query = supabase
        .from("initiatives")
        .select("id, title, status, stage")
        .eq("owner_id", user.id);

      if (isNetworkLeader && actingOrgId) {
        query = (query as any).eq("organization_id", actingOrgId);
      }

      if (initiativeId) {
        query = query.eq("id", initiativeId);
      }

      const { data: initiatives, error: initiativesError } = await query;

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

      // Fetch team members count (unique across all initiatives).
      // Most members are name-only roster entries with no login, so user_id is
      // null. Dedupe only the login-linked ones; a Set of nulls collapses every
      // unlinked person into a count of 1, which is the bug this replaces.
      const { data: teamMembers } = await supabase
        .from("initiative_team_members")
        .select("user_id")
        .in("initiative_id", initiativeIds);

      const linkedMembers = new Set<string>();
      let unlinkedMembers = 0;
      for (const tm of teamMembers || []) {
        if (tm.user_id) linkedMembers.add(tm.user_id);
        else unlinkedMembers++;
      }
      const totalTeamMemberCount = linkedMembers.size + unlinkedMembers;

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
        const targetDate = parseDateOnly(m.target_date);
        return targetDate <= sevenDaysFromNow && targetDate >= new Date();
      }).length || 0;

      // Fetch decision briefs to assess initiative health
      const { data: decisionBriefs } = await supabase
        .from("decision_briefs")
        .select("feasibility_score, checklist_completed, initiative_id")
        .in("initiative_id", initiativeIds);

      // At risk means the brief itself says feasibility is weak. The score is
      // on a 1 to 5 scale, so the old < 60 threshold flagged every initiative
      // that had a score at all, and an unfinished Decide checklist is normal
      // in-progress work, not risk.
      const atRiskIds = new Set(
        (decisionBriefs || [])
          .filter(db => db.feasibility_score !== null && db.feasibility_score < 3)
          .map(db => db.initiative_id)
      );
      const atRiskCount = atRiskIds.size;
      const initiativeHealth = (initiatives || []).map(i => ({
        id: i.id,
        title: (i as { title?: string }).title || "Untitled initiative",
        atRisk: atRiskIds.has(i.id),
      }));

      return {
        totalInitiatives: initiatives?.length || 0,
        activeInitiatives: initiatives?.filter(i => i.status === "active").length || 0,
        avgFidelityScore: Math.round(avgFidelity * 10) / 10,
        totalTeamMembers: totalTeamMemberCount,
        upcomingDeadlines,
        completedMilestones,
        totalMilestones,
        onTrackInitiatives: (initiatives?.length || 0) - atRiskCount,
        atRiskInitiatives: atRiskCount,
        initiativeHealth,
      };
    },
  });
}
