import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export interface BudgetSummary {
  initiativeId: string;
  initiativeTitle: string;
  totalEstimated: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
}

export function useBudgetTracking(initiativeId?: string) {
  // The network administrator's or a district administrator's "Acting on"
  // school scopes the dashboard to that school, agreeing with the
  // initiative switcher and lists; everyone else queries exactly as before.
  const { actingOrgId } = useOrganization();

  return useQuery({
    queryKey: actingOrgId
      ? ["budgetTracking", initiativeId, actingOrgId]
      : ["budgetTracking", initiativeId],
    queryFn: async (): Promise<BudgetSummary[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build query
      let query = supabase
        .from("initiatives")
        .select(`
          id,
          title,
          budget_items (
            estimated_cost,
            actual_cost
          )
        `)
        .eq("owner_id", user.id)
        .eq("status", "active");

      if (actingOrgId) {
        query = (query as any).eq("organization_id", actingOrgId);
      }

      if (initiativeId) {
        query = query.eq("id", initiativeId);
      }

      const { data: initiatives, error: initiativesError } = await query;

      if (initiativesError) throw initiativesError;

      return (initiatives || []).map(initiative => {
        const budgetItems = (initiative as any).budget_items || [];
        
        const totalEstimated = budgetItems.reduce(
          (sum: number, item: any) => sum + (Number(item.estimated_cost) || 0),
          0
        );
        
        const totalActual = budgetItems.reduce(
          (sum: number, item: any) => sum + (Number(item.actual_cost) || 0),
          0
        );

        const variance = totalEstimated - totalActual;
        const variancePercentage = totalEstimated > 0 
          ? Math.round((variance / totalEstimated) * 100)
          : 0;

        return {
          initiativeId: initiative.id,
          initiativeTitle: initiative.title,
          totalEstimated,
          totalActual,
          variance,
          variancePercentage,
        };
      }).filter(summary => summary.totalEstimated > 0); // Only show initiatives with budget data
    },
  });
}
