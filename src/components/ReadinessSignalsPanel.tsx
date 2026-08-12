import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import {
  useReadinessSignals,
  READINESS_SIGNAL_DEFS,
  type ReadinessSignal,
} from "@/hooks/useReadinessSignals";

/** Five launch-readiness signals for the Decide stage. Unmet signals are framed
 *  as worth shoring up before launch, never as a block. */
export function ReadinessSignalsPanel({ initiativeId }: { initiativeId: string }) {
  const { signals, missingColumn, briefExists, save } = useReadinessSignals(initiativeId);
  const [rows, setRows] = useState<ReadinessSignal[]>(signals);
  // Hold local edits (a half-typed note) against server refetches; only adopt
  // server values when the user is not mid-edit.
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setRows(signals);
  }, [signals]);

  if (missingColumn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" aria-hidden="true" />
            Readiness signals
          </CardTitle>
          <CardDescription>
            This will activate after the next database update for this workspace.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const commit = (next: ReadinessSignal[]) => {
    dirty.current = true;
    setRows(next);
    save(next, { onSuccess: () => { dirty.current = false; } });
  };

  const setMet = (key: string, met: boolean) =>
    commit(rows.map((r) => (r.key === key ? { ...r, met } : r)));

  const setNote = (key: string, note: string) => {
    dirty.current = true;
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, note } : r)));
  };

  const commitNote = () => commit(rows);

  const metCount = rows.filter((r) => r.met).length;
  const total = READINESS_SIGNAL_DEFS.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
            Readiness signals
          </CardTitle>
          <Badge variant={metCount === total ? "default" : "secondary"}>
            {metCount} of {total} met
          </Badge>
        </div>
        <CardDescription>
          {metCount === total
            ? "All five signals are in place. This is as ready as it gets going in."
            : "The rest are worth shoring up before launch, not a reason to hold back."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!briefExists && (
          <p className="text-xs text-muted-foreground">
            Add a problem statement and target group above, then these signals will save with your brief.
          </p>
        )}
        {READINESS_SIGNAL_DEFS.map((def) => {
          const row = rows.find((r) => r.key === def.key);
          const met = !!row?.met;
          return (
            <div key={def.key} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor={`signal-${def.key}`} className="text-sm font-medium cursor-pointer">
                    {def.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{def.help}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs ${met ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400"}`}>
                    {met ? "In place" : "Not yet"}
                  </span>
                  <Switch
                    id={`signal-${def.key}`}
                    checked={met}
                    onCheckedChange={(v) => setMet(def.key, v)}
                  />
                </div>
              </div>
              <Textarea
                value={row?.note ?? ""}
                onChange={(e) => setNote(def.key, e.target.value)}
                onBlur={commitNote}
                rows={2}
                className="text-sm"
                placeholder={met ? "How do you know? Name the evidence." : "What would it take to get here?"}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
