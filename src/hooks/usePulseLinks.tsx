import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PulseLink {
  id: string;
  initiative_id: string;
  token: string;
  active_ingredient_id: string | null;
  expected_staff_count: number | null;
  revoked: boolean;
  expires_at: string | null;
  created_at: string;
}

export function usePulseLinks(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["pulse-links", initiativeId];

  const { data: link, isLoading } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pulse_links" as any)
        .select("*")
        .eq("initiative_id", initiativeId!)
        .eq("revoked", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const rows = (data as unknown as PulseLink[]) || [];
      return rows[0] ?? null;
    },
  });

  const create = useMutation({
    mutationFn: async (activeIngredientId: string | null) => {
      const { data, error } = await supabase
        .from("pulse_links" as any)
        .insert({ initiative_id: initiativeId, active_ingredient_id: activeIngredientId })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PulseLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Staff link ready", description: "Share it or print the QR. No account needed to send a pulse." });
    },
    onError: (e: Error) => toast({ title: "Could not create the link", description: e.message, variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("pulse_links" as any)
        .update({ revoked: true })
        .eq("id", id)
        .select();
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) throw new Error("Only the initiative owner or team can do this.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Link closed", description: "The old link no longer accepts pulses." });
    },
    onError: (e: Error) => toast({ title: "Could not close the link", description: e.message, variant: "destructive" }),
  });

  const rotate = useMutation({
    mutationFn: async (input: { currentId: string; activeIngredientId: string | null }) => {
      await supabase.from("pulse_links" as any).update({ revoked: true }).eq("id", input.currentId);
      const { data, error } = await supabase
        .from("pulse_links" as any)
        .insert({ initiative_id: initiativeId, active_ingredient_id: input.activeIngredientId })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PulseLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "New link issued", description: "The previous link is now closed." });
    },
    onError: (e: Error) => toast({ title: "Could not rotate the link", description: e.message, variant: "destructive" }),
  });

  return {
    link: link ?? null,
    isLoading,
    create: create.mutate,
    isCreating: create.isPending,
    revoke: revoke.mutate,
    rotate: rotate.mutate,
    isRotating: rotate.isPending,
  };
}
