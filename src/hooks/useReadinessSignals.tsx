import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingColumn } from "@/lib/missingTable";

// Readiness assessment, converging across the Alberta Guidebook p.15 and the
// Pathway to Implementation p.4. Five signals worth having in place before
// launch. Stored on decision_briefs.readiness_signals as
// [{ key, met: boolean, note: string }].
export interface ReadinessSignal {
  key: string;
  met: boolean;
  note: string;
}

export const READINESS_SIGNAL_DEFS: { key: string; label: string; help: string }[] = [
  {
    key: "sponsor_authority",
    label: "A sponsor with real authority",
    help: "Someone with authority over people, schedule, and budget is backing this.",
  },
  {
    key: "named_champion",
    label: "A named champion with dedicated time",
    help: "A specific person has time set aside to carry this, not just enthusiasm.",
  },
  {
    key: "realistic_timeline",
    label: "A clear, realistic timeline",
    help: "The timeline is specific and honest about how long the work takes.",
  },
  {
    key: "barriers_named",
    label: "Barriers and enablers named",
    help: "The likely barriers and enablers are named, with mitigation discussed.",
  },
  {
    key: "student_benefit",
    label: "The benefit is concrete, in student terms",
    help: "The payoff is stated as something that changes for students.",
  },
];

export function defaultReadinessSignals(): ReadinessSignal[] {
  return READINESS_SIGNAL_DEFS.map((d) => ({ key: d.key, met: false, note: "" }));
}

/** Merge a stored array onto the canonical five, tolerant of missing keys or
 *  reordering, so the panel always renders the same five signals. */
function normalize(stored: unknown): ReadinessSignal[] {
  const arr = Array.isArray(stored) ? (stored as ReadinessSignal[]) : [];
  return READINESS_SIGNAL_DEFS.map((d) => {
    const found = arr.find((s) => s && s.key === d.key);
    return { key: d.key, met: !!found?.met, note: found?.note ?? "" };
  });
}

export function useReadinessSignals(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["readiness-signals", initiativeId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      // Naming the column makes a not-yet-migrated database fail loudly here,
      // where we can catch it and degrade, instead of silently returning
      // nothing. Cast because the generated types predate this column.
      const { data, error } = await supabase
        .from("decision_briefs" as any)
        .select("id, readiness_signals")
        .eq("initiative_id", initiativeId!)
        .maybeSingle();
      if (error) {
        if (isMissingColumn(error)) {
          return { missingColumn: true, briefExists: false, signals: defaultReadinessSignals() };
        }
        throw error;
      }
      const row = data as { id?: string; readiness_signals?: unknown } | null;
      return {
        missingColumn: false,
        briefExists: !!row?.id,
        signals: normalize(row?.readiness_signals),
      };
    },
  });

  const save = useMutation({
    mutationFn: async (signals: ReadinessSignal[]) => {
      // Update in place rather than upsert: decision_briefs requires a problem
      // statement and target group, so the brief must already exist. If it does
      // not, the update touches zero rows and we say so, gently, rather than
      // fabricating a half-empty brief.
      const { data, error } = await supabase
        .from("decision_briefs" as any)
        .update({ readiness_signals: signals })
        .eq("initiative_id", initiativeId!)
        .select("id");
      if (error) {
        if (isMissingColumn(error)) return { persisted: false, missingColumn: true };
        throw error;
      }
      const rows = (data as unknown[] | null) ?? [];
      return { persisted: rows.length > 0, missingColumn: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: key });
      if (result.missingColumn) return; // panel already shows the awaiting-update state
      if (!result.persisted) {
        toast({
          title: "Add your decision brief first",
          description: "Enter a problem statement and target group above, then your readiness signals will save.",
        });
      }
    },
    onError: (e: Error) =>
      toast({ title: "Could not save readiness signals", description: e.message, variant: "destructive" }),
  });

  return {
    signals: data?.signals ?? defaultReadinessSignals(),
    missingColumn: data?.missingColumn ?? false,
    briefExists: data?.briefExists ?? false,
    isLoading,
    save: save.mutate,
    isSaving: save.isPending,
  };
}
