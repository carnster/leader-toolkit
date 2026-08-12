import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingTable } from "@/lib/missingTable";

/** Every alert type the daily notification tick can generate, with leader-facing
 *  copy. The `type` value must match the literal each create_*_notifications()
 *  function inserts (see supabase/migrations), or a toggle here silences
 *  nothing. A type absent from user_notification_prefs is enabled: prefs only
 *  store opt-outs, and the notifications_respect_prefs trigger enforces them
 *  for every generator. */
export const NOTIFICATION_TYPES: { type: string; label: string; detail: string }[] = [
  { type: "milestone_deadline", label: "Milestone deadlines", detail: "A milestone is coming due soon." },
  { type: "milestone_overdue", label: "Overdue milestones", detail: "A milestone passed its target date and is not complete." },
  { type: "commitment_overdue", label: "Overdue commitments", detail: "A commitment passed its due date and is still open." },
  { type: "pulse_drift", label: "Pulse drift", detail: "Average traction dropped sharply week over week." },
  { type: "observation_scheduled", label: "Observation reminders", detail: "A scheduled observation is coming up." },
  { type: "pd_activity_upcoming", label: "Professional learning reminders", detail: "A scheduled PD activity is coming up." },
];

export function useNotificationPrefs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["notification-prefs"];

  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Record<string, boolean>> => {
      const { data, error } = await supabase
        .from("user_notification_prefs" as any)
        .select("type, enabled");
      if (error) throw error;
      const prefs: Record<string, boolean> = {};
      for (const row of (data as any[]) || []) prefs[row.type] = row.enabled;
      return prefs;
    },
    retry: (failureCount, err) => !isMissingTable(err) && failureCount < 2,
  });

  const setEnabled = useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      // user_id defaults to auth.uid() on insert, which is what the RLS
      // WITH CHECK compares against, so it does not need to be sent here.
      const { error } = await supabase
        .from("user_notification_prefs" as any)
        .upsert({ type, enabled } as any, { onConflict: "user_id,type" });
      if (error) throw error;
    },
    onMutate: async ({ type, enabled }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Record<string, boolean>>(key);
      queryClient.setQueryData(key, (old: Record<string, boolean> | undefined) => ({
        ...(old || {}),
        [type]: enabled,
      }));
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
      toast({ title: "Could not save the preference", description: e.message, variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const prefs = data ?? {};

  return {
    isLoading,
    missingTable: isMissingTable(error),
    isEnabled: (type: string) => prefs[type] !== false,
    setEnabled: setEnabled.mutate,
    isSaving: setEnabled.isPending,
    pendingType: setEnabled.variables?.type,
  };
}
