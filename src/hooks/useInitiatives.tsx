import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getActingOrgId, useOrganization } from "@/hooks/useOrganization";

export interface InitiativeMandate {
  practice?: string;
  rationale?: string;
  nonnegotiables?: string[];
  // True when the mandated practice was not in the template library, so the
  // school authors its own core practices rather than importing them.
  not_in_library?: boolean;
}

export interface Initiative {
  id: string;
  title: string;
  description: string | null;
  stage: "decide" | "plan" | "implement" | "monitor" | "sustain";
  status: "active" | "on_hold" | "completed" | "archived";
  // "full" is the complete four-stage process; "fast_track" is the compressed
  // path for a district-directed initiative. Defaults to "full" server-side, so
  // an older row (or a deployment that has not run the mode paste yet) reads as
  // a normal initiative.
  mode?: "full" | "fast_track";
  // Present only on fast-track initiatives: how the district framed the mandate.
  mandate?: InitiativeMandate | null;
  owner_id: string;
  start_date: string | null;
  target_end_date: string | null;
  context_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useInitiatives() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // The network administrator's or a district administrator's "Acting on"
  // school scopes the initiative list to that school; everyone else queries
  // exactly as before, with the same query key shape, so an ordinary account
  // sees zero change.
  const { actingOrgId } = useOrganization();

  const { data: initiatives, isLoading, error } = useQuery({
    queryKey: actingOrgId ? ["initiatives", actingOrgId] : ["initiatives"],
    queryFn: async () => {
      let query = supabase
        .from("initiatives")
        .select("*")
        .order("created_at", { ascending: false });

      if (actingOrgId) {
        query = (query as any).eq("organization_id", actingOrgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Initiative[];
    },
  });

  const createInitiative = useMutation({
    mutationFn: async (initiative: Partial<Initiative>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Stamp whatever school is currently being acted on (network/district
      // admin's "Acting on" selection), falling back to the user's own org.
      // Personal (no-org) users keep working exactly as today: the key is
      // only sent when there is an org to attach, so a deployment where the
      // organizations schema has not been pasted in yet never sees an
      // unknown "organization_id" column in the insert.
      const organizationId = await getActingOrgId(supabase);

      const { data, error } = await supabase
        .from("initiatives")
        .insert([{
          title: initiative.title!,
          description: initiative.description,
          stage: initiative.stage || "decide",
          status: initiative.status || "active",
          owner_id: userData.user.id,
          start_date: initiative.start_date,
          target_end_date: initiative.target_end_date,
          context_tags: initiative.context_tags,
          ...(organizationId ? { organization_id: organizationId } : {}),
          // Only send these when set, same guard as organization_id: a
          // deployment that has not run the fast-track paste yet never sees an
          // unknown column in the insert.
          ...(initiative.mode ? { mode: initiative.mode } : {}),
          ...(initiative.mandate ? { mandate: initiative.mandate } : {}),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({
        title: "Initiative created",
        description: "Your initiative has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInitiative = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Initiative> & { id: string }) => {
      // Never let a normal update rewrite tenancy. organization_id and owner_id
      // are set only at creation (guarded by RLS WITH CHECK); stripping them here
      // is defense in depth against a client relocating a row into another org.
      const safeUpdates: Record<string, unknown> = { ...updates };
      delete safeUpdates.organization_id;
      delete safeUpdates.owner_id;
      const { data, error } = await supabase
        .from("initiatives")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      toast({
        title: "Initiative updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInitiative = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("initiatives")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;
      if ((data ?? []).length === 0) {
        throw new Error("Only the initiative owner can do this. Ask the owner to make this change.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardAnalytics"] });
      queryClient.invalidateQueries({ queryKey: ["readinessStats"] });
      queryClient.invalidateQueries({ queryKey: ["budgetTracking"] });
      queryClient.invalidateQueries({ queryKey: ["fidelityTrends"] });
      toast({
        title: "Initiative deleted",
        description: "The initiative has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting initiative",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    initiatives: initiatives || [],
    isLoading,
    error,
    createInitiative: createInitiative.mutate,
    updateInitiative: updateInitiative.mutate,
    deleteInitiative: deleteInitiative.mutate,
    isCreating: createInitiative.isPending,
    isUpdating: updateInitiative.isPending,
    isDeleting: deleteInitiative.isPending,
  };
}
