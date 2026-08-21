import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import { useOrganization } from "@/hooks/useOrganization";

export interface FidelityTrendData {
  date: string;
  avgRating: number;
  observationCount: number;
}

export function useFidelityTrends(days: number = 30, initiativeId?: string) {
  // The network administrator's or a district administrator's "Acting on"
  // school scopes the dashboard to that school, agreeing with the
  // initiative switcher and lists; everyone else queries exactly as before.
  const { actingOrgId } = useOrganization();

  return useQuery({
    queryKey: actingOrgId
      ? ["fidelityTrends", days, initiativeId, actingOrgId]
      : ["fidelityTrends", days, initiativeId],
    queryFn: async (): Promise<FidelityTrendData[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDate = subDays(new Date(), days);

      let initiativeIds: string[] = [];

      if (initiativeId) {
        initiativeIds = [initiativeId];
      } else {
        // Fetch all user initiatives
        let initiativesQuery = supabase
          .from("initiatives")
          .select("id")
          .eq("owner_id", user.id);

        if (actingOrgId) {
          initiativesQuery = (initiativesQuery as any).eq("organization_id", actingOrgId);
        }

        const { data: initiatives } = await initiativesQuery;

        initiativeIds = initiatives?.map(i => i.id) || [];
      }

      if (initiativeIds.length === 0) return [];

      // Fetch fidelity logs
      const { data: logs, error } = await supabase
        .from("fidelity_logs")
        .select("rating, observed_at")
        .in("initiative_id", initiativeIds)
        .gte("observed_at", startDate.toISOString())
        .order("observed_at", { ascending: true });

      if (error) throw error;

      // Group by date and calculate averages
      const groupedByDate: Record<string, { sum: number; count: number }> = {};

      logs?.forEach(log => {
        const dateKey = format(startOfDay(new Date(log.observed_at)), "yyyy-MM-dd");
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = { sum: 0, count: 0 };
        }
        groupedByDate[dateKey].sum += log.rating;
        groupedByDate[dateKey].count += 1;
      });

      // Convert to array and calculate averages
      return Object.entries(groupedByDate).map(([date, data]) => ({
        date: format(new Date(date), "MMM dd"),
        avgRating: Math.round((data.sum / data.count) * 10) / 10,
        observationCount: data.count,
      }));
    },
  });
}
