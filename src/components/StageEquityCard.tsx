import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { EquityChecklist, type EquityStage } from "@/components/EquityChecklist";

/** Renders the stage-specific equity questions on a stage page and persists
 *  answers itself, so Plan, Implement, and Sustain get the equity lens without
 *  each page hand-rolling save logic.
 *
 *  It writes only the equity_checklist column, merging one changed key at a
 *  time. Question ids are unique across stages, so this never clobbers another
 *  stage's answers or the ones Decide manages. It updates rather than inserts
 *  because a decision brief requires a problem statement and target group; if
 *  no brief exists yet, the card sits quiet rather than erroring. */
type EquityStore = { checked: Record<string, boolean>; notes: Record<string, string> };

export function StageEquityCard({ stage, initiativeId }: { stage: EquityStage; initiativeId: string }) {
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const briefIdRef = useRef<string | null>(null);
  const hydrated = useRef(false);

  const { data } = useQuery({
    queryKey: ["stage-equity", initiativeId],
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decision_briefs")
        .select("id, equity_checklist")
        .eq("initiative_id", initiativeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data && !hydrated.current) {
      hydrated.current = true;
      briefIdRef.current = (data as unknown as { id: string }).id;
      const store = ((data as unknown as { equity_checklist?: EquityStore }).equity_checklist) || { checked: {}, notes: {} };
      setChecked(store.checked || {});
      setNotes(store.notes || {});
    }
  }, [data]);

  // Read-modify-write the whole equity_checklist so a concurrent editor on
  // another stage is not overwritten by a stale partial. Keys are disjoint
  // across stages, so the merge is lossless.
  const persist = async (nextChecked: Record<string, boolean>, nextNotes: Record<string, string>) => {
    if (!briefIdRef.current) return;
    try {
      const { data: fresh } = await supabase
        .from("decision_briefs")
        .select("equity_checklist")
        .eq("id", briefIdRef.current)
        .maybeSingle();
      const base = ((fresh as unknown as { equity_checklist?: EquityStore } | null)?.equity_checklist) || { checked: {}, notes: {} };
      const merged = {
        checked: { ...(base.checked || {}), ...nextChecked },
        notes: { ...(base.notes || {}), ...nextNotes },
      };
      await (supabase.from("decision_briefs") as any).update({ equity_checklist: merged }).eq("id", briefIdRef.current);
      queryClient.invalidateQueries({ queryKey: ["stage-equity", initiativeId] });
    } catch {
      /* a failed equity save should never interrupt the page */
    }
  };

  if (!initiativeId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5" aria-hidden="true" />
          Equity check for this stage
        </CardTitle>
        <CardDescription>
          A few questions written for this stage. They build on the strengths of the students furthest
          from opportunity, and each is one you can answer with evidence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EquityChecklist
          stage={stage}
          checked={checked}
          onCheckedChange={(id, val) => {
            const next = { ...checked, [id]: val };
            setChecked(next);
            void persist({ [id]: val }, {});
          }}
          notes={notes}
          onNotesChange={(id, val) => {
            const next = { ...notes, [id]: val };
            setNotes(next);
            void persist({}, { [id]: val });
          }}
        />
      </CardContent>
    </Card>
  );
}
