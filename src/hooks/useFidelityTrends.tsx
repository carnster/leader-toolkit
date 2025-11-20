import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";

export interface FidelityTrendData {
  date: string;
  avgRating: number;
  observationCount: number;
}

export function useFidelityTrends(days: number = 30, initiativeId?: string) {
  return useQuery({
    queryKey: ["fidelityTrends", days, initiativeId],
    queryFn: async (): Promise<FidelityTrendData[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDate = subDays(new Date(), days);

      let initiativeIds: string[] = [];
      
      if (initiativeId) {
        initiativeIds = [initiativeId];
      } else {
        // Fetch all user initiatives
        const { data: initiatives } = await supabase
          .from("initiatives")
          .select("id")
          .eq("owner_id", user.id);

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
