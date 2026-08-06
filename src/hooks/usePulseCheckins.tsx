import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export type UsedStatus = "yes" | "partly" | "not_yet";

export interface PulseCheckin {
  id: string;
  initiative_id: string;
  respondent_id: string;
  respondent_name: string | null;
  week_of: string;
  focus_ingredient_id: string | null;
  used_status: UsedStatus;
  traction: number;
  needs_support: string | null;
  created_at: string;
}

/** Monday of the current week (UTC), as a yyyy-MM-dd date-only anchor.
 *  UTC so it matches the submit-pulse-via-link edge function exactly; account
 *  pulses and link pulses must land in the same week bucket. */
export function currentWeekOf(): string {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function usePulseCheckins(initiativeId: string | undefined) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const weekOf = currentWeekOf();

  // The initiative's pulses (recent), for the leader dashboard.
  const { data: checkins, isLoading, error, isError } = useQuery({
    queryKey: ["pulse-checkins", initiativeId],
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pulse_checkins" as any)
        .select("id, initiative_id, respondent_id, respondent_name, week_of, focus_ingredient_id, used_status, traction, needs_support, created_at, updated_at, via_link_id")
        .eq("initiative_id", initiativeId!)
        .order("week_of", { ascending: false });
      if (error) throw error;
      return (data as unknown as PulseCheckin[]) || [];
    },
  });

  // The signed-in user's own pulse for this week, if any.
  const { data: myCheckin } = useQuery({
    queryKey: ["pulse-my-checkin", initiativeId, user?.id, weekOf],
    enabled: !!initiativeId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pulse_checkins" as any)
        .select("id, initiative_id, respondent_id, respondent_name, week_of, focus_ingredient_id, used_status, traction, needs_support, created_at, updated_at, via_link_id")
        .eq("initiative_id", initiativeId!)
        .eq("respondent_id", user!.id)
        .eq("week_of", weekOf)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as PulseCheckin) || null;
    },
  });

  const submit = useMutation({
    mutationFn: async (input: {
      used_status: UsedStatus;
      traction: number;
      needs_support: string | null;
      focus_ingredient_id: string | null;
    }) => {
      if (!initiativeId || !user?.id) throw new Error("Sign in to send your pulse.");
      const row = {
        initiative_id: initiativeId,
        respondent_id: user.id,
        respondent_name: (user.user_metadata as any)?.full_name ?? null,
        week_of: weekOf,
        used_status: input.used_status,
        traction: input.traction,
        needs_support: input.needs_support?.trim() || null,
        focus_ingredient_id: input.focus_ingredient_id,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("pulse_checkins" as any)
        .upsert(row, { onConflict: "initiative_id,respondent_id,week_of" })
        .select("id, initiative_id, respondent_id, respondent_name, week_of, focus_ingredient_id, used_status, traction, needs_support, created_at, updated_at, via_link_id");
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) {
        throw new Error("Could not save your pulse. You may not be on this initiative's team.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-checkins", initiativeId] });
      queryClient.invalidateQueries({ queryKey: ["pulse-my-checkin", initiativeId] });
      toast({ title: "Pulse sent", description: "Thanks. Your leader sees what you need, not a grade." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not send your pulse", description: e.message, variant: "destructive" }),
  });

  return {
    checkins: checkins || [],
    myCheckin: myCheckin ?? null,
    isLoading,
    error,
    isError,
    weekOf,
    submit: submit.mutateAsync,
    isSubmitting: submit.isPending,
  };
}
