import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FidelityLog {
  id: string;
  initiative_id: string;
  component_id: string | null;
  observer_id: string;
  rating: number;
  notes: string | null;
  observed_at: string;
  created_at: string;
  schedule_id: string | null;
  checklist_id: string | null;
  checklist_responses: any;
  evidence_photos: string[];
  duration_minutes: number | null;
  location: string | null;
  log_type: 'quick' | 'detailed' | 'team' | 'standard';
  participants: string[];
  follow_up_actions: string[] | null;
}

export function useFidelityLogs(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fidelityLogs, isLoading, error, isError } = useQuery({
    queryKey: ["fidelity-logs", initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from("fidelity_logs")
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("observed_at", { ascending: false });

      if (error) throw error;
      return data as FidelityLog[];
    },
    enabled: !!initiativeId,
  });

  const createLog = useMutation({
    mutationFn: async (log: Omit<FidelityLog, "id" | "created_at" | "observed_at">) => {
      const { data: userData } = await supabase.auth.getUser();
      const observerId = log.observer_id || userData.user?.id;
      if (!observerId) throw new Error("Not authenticated");

      const { data, error} = await supabase
        .from("fidelity_logs")
        .insert({
          initiative_id: initiativeId!,
          component_id: log.component_id,
          rating: log.rating,
          notes: log.notes,
          observer_id: observerId,
          observed_at: new Date().toISOString(),
          schedule_id: log.schedule_id || null,
          checklist_id: log.checklist_id || null,
          checklist_responses: log.checklist_responses || {},
          evidence_photos: log.evidence_photos || [],
          duration_minutes: log.duration_minutes || null,
          location: log.location || null,
          log_type: log.log_type || 'standard',
          participants: log.participants || [],
          follow_up_actions: log.follow_up_actions || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Close the loop: each follow-up action becomes an open commitment
      // instead of a field that is written once and never read again.
      // Best-effort: a failure here (e.g. the commitments table not yet
      // migrated) must never lose the observation itself — but the toast must
      // only claim what actually persisted, so count the returned rows.
      // (Supabase resolves with {error} rather than throwing, so the result
      // has to be inspected; a bare await-in-try silently "succeeds".)
      const actions = Array.from(new Set((log.follow_up_actions || []).map((a) => a.trim()).filter(Boolean)));
      let committed = 0;
      if (actions.length > 0 && data) {
        try {
          const { data: rows, error: cErr } = await supabase
            .from("commitments" as any)
            .insert(
              actions.map((title) => ({
                initiative_id: initiativeId!,
                title: title.slice(0, 200),
                source: "observation",
                source_id: (data as any).id,
              }))
            )
            .select("id");
          if (!cErr) committed = (rows as unknown[] | null)?.length ?? 0;
        } catch {
          /* observation saved; commitments can be added manually */
        }
      }
      return { log: data, committed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["fidelity-logs", initiativeId] });
      queryClient.invalidateQueries({ queryKey: ["commitments", initiativeId] });
      toast({
        title: "Log saved",
        description: result.committed > 0
          ? `Fidelity log recorded. ${result.committed} follow-up action${result.committed === 1 ? "" : "s"} added to Commitments.`
          : "Fidelity log has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving log",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    fidelityLogs: fidelityLogs || [],
    isLoading,
    error,
    isError,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
  };
}
