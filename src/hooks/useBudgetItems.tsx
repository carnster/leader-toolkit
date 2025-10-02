import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BudgetItem {
  id: string;
  initiative_id: string;
  category: string;
  description: string | null;
  estimated_cost: number;
  actual_cost: number | null;
  funding_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useBudgetItems(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgetItems, isLoading } = useQuery({
    queryKey: ["budget-items", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("category", { ascending: true });

      if (error) throw error;
      return data as BudgetItem[];
    },
    enabled: !!initiativeId,
  });

  const createBudgetItem = useMutation({
    mutationFn: async (item: Omit<BudgetItem, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("budget_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-items", initiativeId] });
      toast({
        title: "Budget item added",
        description: "Budget item has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating budget item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBudgetItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("budget_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-items", initiativeId] });
      toast({
        title: "Budget item updated",
        description: "Changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating budget item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBudgetItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-items", initiativeId] });
      toast({
        title: "Budget item deleted",
        description: "Budget item has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting budget item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    budgetItems: budgetItems || [],
    isLoading,
    createBudgetItem: createBudgetItem.mutate,
    updateBudgetItem: updateBudgetItem.mutate,
    deleteBudgetItem: deleteBudgetItem.mutate,
    isCreating: createBudgetItem.isPending,
    isUpdating: updateBudgetItem.isPending,
    isDeleting: deleteBudgetItem.isPending,
  };
}
