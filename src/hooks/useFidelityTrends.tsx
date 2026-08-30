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
        // Fetch initiatives. Acting on a school (network/district admin)
        // scopes to the whole school, not just this account's own
        // initiatives; RLS still enforces who may actually read the rows.
        // Everyone else keeps the personal, owner-scoped query exactly as
        // before.
        let initiativesQuery = supabase
          .from("initiatives")
          .select("id");

        if (actingOrgId) {
          initiativesQuery = (initiativesQuery as any).eq("organization_id", actingOrgId);
        } else {
          initiativesQuery = initiativesQuery.eq("owner_id", user.id);
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

      // Group by date and calculate averages.
      // TODO(PB 14 two-dimension model): two-dimension checklist logs write
      // rating = null (Delivery/Enactment are never averaged into a single
      // number), so they're excluded here rather than folded into this
      // legacy avgRating line. A real two-dimension trend needs its own
      // Delivery series, Enactment series, and divergence-rate-over-time —
      // deliberately deferred rather than bolted on here; see
      // src/lib/fidelityModel.ts for the building blocks (practiceRating,
      // isDivergent) that follow-up should reuse.
      const groupedByDate: Record<string, { sum: number; count: number }> = {};

      logs?.filter((log): log is typeof log & { rating: number } => typeof log.rating === "number").forEach(log => {
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
