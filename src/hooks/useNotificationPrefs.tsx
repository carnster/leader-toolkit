import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingTable } from "@/lib/missingTable";

/** Every alert type the daily tick can generate, with leader-facing labels.
 *  A type absent from user_notification_prefs is enabled: prefs only store
 *  opt-outs, and the database trigger enforces them for every generator. */
export const NOTIFICATION_TYPES: { type: string; label: string; detail: string }[] = [
  { type: "milestone", label: "Milestone reminders", detail: "A milestone is due within 7 days" },
  { type: "milestone_overdue", label: "Overdue milestones", detail: "A milestone passed its target date and is not complete" },
  { type: "observation", label: "Observation reminders", detail: "A scheduled observation is coming up" },
  { type: "pd_activity", label: "Professional learning reminders", detail: "A PD session is coming up" },
  { type: "commitment_overdue", label: "Overdue commitments", detail: "A commitment passed its due date and is still open" },
  { type: "pulse_drift", label: "Pulse drift", detail: "Team traction dropped a full point week over week" },
];

export function useNotificationPrefs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["notification-prefs"];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notification_prefs" as any)
        .select("type, enabled");
      if (error) {
        if (isMissingTable(error)) return { missingTable: true, prefs: {} as Record<string, boolean> };
        throw error;
      }
      const prefs: Record<string, boolean> = {};
      for (const row of (data as any[]) || []) prefs[row.type] = row.enabled;
      return { missingTable: false, prefs };
    },
  });

  const setPref = useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("user_notification_prefs" as any)
        .upsert({ type, enabled } as any, { onConflict: "user_id,type" });
      if (error) throw error;
    },
    onMutate: async ({ type, enabled }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: any) => ({
        ...(old || { missingTable: false, prefs: {} }),
        prefs: { ...(old?.prefs || {}), [type]: enabled },
      }));
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
      toast({ title: "Could not save the preference", description: e.message, variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    prefs: data?.prefs ?? {},
    missingTable: data?.missingTable ?? false,
    isLoading,
    setPref: setPref.mutate,
  };
}
