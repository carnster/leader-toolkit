import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BudgetSummary {
  initiativeId: string;
  initiativeTitle: string;
  totalEstimated: number;
  totalActual: number;
  variance: number;
  variancePercentage: number;
}

export function useBudgetTracking() {
  return useQuery({
    queryKey: ["budgetTracking"],
    queryFn: async (): Promise<BudgetSummary[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch initiatives with budget items
      const { data: initiatives, error: initiativesError } = await supabase
        .from("initiatives")
        .select(`
          id,
          title,
          budget_items (
            estimated_cost,
            actual_cost
          )
        `)
        .or(`owner_id.eq.${user.id},id.in.(select initiative_id from initiative_team_members where user_id = ${user.id})`)
        .eq("status", "active");

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
