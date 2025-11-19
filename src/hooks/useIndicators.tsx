import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Indicator {
  id: string;
  initiative_id: string;
  name: string;
  type: "leading" | "lagging";
  target_value: number | null;
  source: string | null;
  schedule: string | null;
  archived: boolean;
  created_at: string;
}

export interface IndicatorValue {
  id: string;
  indicator_id: string;
  value: number;
  notes: string | null;
  recorded_at: string;
}

export function useIndicators(initiativeId: string | undefined, includeArchived = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: indicators, isLoading } = useQuery({
    queryKey: ["indicators", initiativeId, includeArchived],
    queryFn: async () => {
      if (!initiativeId) return [];
      let query = supabase
        .from("indicators")
        .select("*")
        .eq("initiative_id", initiativeId);
      
      if (!includeArchived) {
        query = query.eq("archived", false);
      }
      
      const { data, error } = await query.order("type", { ascending: true });

      if (error) throw error;
      return data as Indicator[];
    },
    enabled: !!initiativeId,
  });

  const { data: indicatorValues } = useQuery({
    queryKey: ["indicator-values", initiativeId],
    queryFn: async () => {
      if (!initiativeId || !indicators?.length) return [];
      
      const indicatorIds = indicators.map(i => i.id);
      const { data, error } = await supabase
        .from("indicator_values")
        .select("*")
        .in("indicator_id", indicatorIds)
        .order("recorded_at", { ascending: false });

      if (error) throw error;
      return data as IndicatorValue[];
    },
    enabled: !!initiativeId && !!indicators?.length,
  });

  const createIndicator = useMutation({
    mutationFn: async (indicator: Partial<Indicator>) => {
      const { data, error } = await supabase
        .from("indicators")
        .insert({
          initiative_id: initiativeId!,
          name: indicator.name!,
          type: indicator.type!,
          target_value: indicator.target_value,
          source: indicator.source,
          schedule: indicator.schedule,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators", initiativeId] });
      toast({
        title: "Indicator created",
        description: "New indicator has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating indicator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateIndicator = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Indicator> }) => {
      const { data, error } = await supabase
        .from("indicators")
        .update({
          name: updates.name,
          schedule: updates.schedule,
          target_value: updates.target_value,
          source: updates.source,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators", initiativeId] });
      toast({
        title: "Indicator updated",
        description: "Indicator has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating indicator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveIndicator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("indicators")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators", initiativeId] });
      toast({
        title: "Indicator archived",
        description: "Indicator has been archived and can be restored later.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error archiving indicator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreIndicator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("indicators")
        .update({ archived: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators", initiativeId] });
      toast({
        title: "Indicator restored",
        description: "Indicator has been restored successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error restoring indicator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addIndicatorValue = useMutation({
    mutationFn: async (value: Omit<IndicatorValue, "id">) => {
      const { data, error } = await supabase
        .from("indicator_values")
        .insert(value)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicator-values", initiativeId] });
      toast({
        title: "Value recorded",
        description: "Indicator value has been added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error recording value",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    indicators: indicators || [],
    indicatorValues: indicatorValues || [],
    isLoading,
    createIndicator: createIndicator.mutate,
    updateIndicator: updateIndicator.mutate,
    archiveIndicator: archiveIndicator.mutate,
    restoreIndicator: restoreIndicator.mutate,
    addIndicatorValue: addIndicatorValue.mutate,
    isCreating: createIndicator.isPending,
    isUpdating: updateIndicator.isPending,
    isArchiving: archiveIndicator.isPending,
    isRestoring: restoreIndicator.isPending,
    isAddingValue: addIndicatorValue.isPending,
  };
}
