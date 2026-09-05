import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Eye, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { useIndicators } from "@/hooks/useIndicators";
import { useObservationSchedules } from "@/hooks/useObservationSchedules";
import { usePDSACycles } from "@/hooks/usePDSACycles";

interface WeeklyReadProps {
  initiativeId: string;
  /** Called when the leader should record indicator values (scroll to the indicators section) */
  onRecordValues: () => void;
}

const DAY = 24 * 60 * 60 * 1000;

export function WeeklyRead({ initiativeId, onRecordValues }: WeeklyReadProps) {
  const { fidelityLogs } = useFidelityLogs(initiativeId);
  const { indicators, indicatorValues } = useIndicators(initiativeId);
  const { schedules } = useObservationSchedules(initiativeId);
  const { pdsaCycles } = usePDSACycles(initiativeId);

  const now = Date.now();
  const logs = fidelityLogs ?? [];
  const rated = logs.filter((l) => typeof l.rating === "number");
  const recent = rated.filter((l) => now - new Date(l.observed_at).getTime() <= 30 * DAY);
  const prior = rated.filter((l) => {
    const age = now - new Date(l.observed_at).getTime();
    return age > 30 * DAY && age <= 60 * DAY;
  });
  const avg = (xs: { rating: number | null }[]) =>
    xs.length ? xs.reduce((s, l) => s + (l.rating ?? 0), 0) / xs.length : null;
  const recentAvg = avg(recent);
  const priorAvg = avg(prior);
  const fidelityWord =
    recentAvg === null
      ? "No ratings in the last 30 days"
      : priorAvg === null
      ? `Averaging ${recentAvg.toFixed(1)} of 5`
      : recentAvg - priorAvg > 0.3
      ? `Rising: ${recentAvg.toFixed(1)} of 5, up from ${priorAvg.toFixed(1)}`
      : priorAvg - recentAvg > 0.3
      ? `Slipping: ${recentAvg.toFixed(1)} of 5, down from ${priorAvg.toFixed(1)}`
      : `Holding at ${recentAvg.toFixed(1)} of 5`;

  const active = (indicators ?? []).filter((i) => !i.archived);
  const latestById = new Map<string, { value: number; at: number }>();
  for (const v of indicatorValues ?? []) {
    const at = new Date(v.recorded_at).getTime();
    const cur = latestById.get(v.indicator_id);
    if (!cur || at > cur.at) latestById.set(v.indicator_id, { value: v.value, at });
  }
  const updatedRecently = active.filter((i) => {
    const l = latestById.get(i.id);
    return l && now - l.at <= 30 * DAY;
  }).length;
  const staleCount = active.length - updatedRecently;

  const overdue = (schedules ?? []).filter(
    (s) => s.status === "scheduled" && new Date(s.scheduled_date).getTime() < now - DAY
  ).length;

  const awaitingDecision = (pdsaCycles ?? []).filter(
    (c) => c.status === "complete" && !(c.decision && c.decision.trim())
  ).length;

  // One thing to do next, most urgent first
  let next: { text: string; to?: string; onClick?: () => void } | null = null;
  if (overdue > 0) {
    next = { text: `Log the ${overdue} overdue observation${overdue === 1 ? "" : "s"}`, to: `/implement?section=observe&initiative=${initiativeId}` };
  } else if (awaitingDecision > 0) {
    next = { text: `Decide on ${awaitingDecision} finished improvement cycle${awaitingDecision === 1 ? "" : "s"}: adopt, adapt, or abandon`, to: `/implement?section=improve&initiative=${initiativeId}` };
  } else if (active.length > 0 && staleCount > 0) {
    next = { text: `Record this week's values for ${staleCount} indicator${staleCount === 1 ? "" : "s"}`, onClick: onRecordValues };
  } else if (active.length === 0) {
    next = { text: "Set up the numbers you'll watch", to: `/decide?initiative=${initiativeId}` };
  }

  const tile = (icon: React.ReactNode, label: string, value: string, tone: "ok" | "warn" | "muted") => (
    <div className={`rounded-lg border p-3 ${tone === "warn" ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20" : tone === "ok" ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="mt-1 text-sm font-medium leading-snug">{value}</p>
    </div>
  );

  return (
    <Card className="border-[hsl(var(--stage-implement))]/30">
      <CardContent className="pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">This week's read</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tile(<Eye className="h-3.5 w-3.5" />, "Fidelity", fidelityWord, recentAvg === null ? "muted" : recentAvg >= 4 ? "ok" : "warn")}
          {tile(<Activity className="h-3.5 w-3.5" />, "Numbers", active.length === 0 ? "No indicators yet" : `${updatedRecently} of ${active.length} updated in the last 30 days`, active.length === 0 ? "muted" : staleCount === 0 ? "ok" : "warn")}
          {tile(<AlertTriangle className="h-3.5 w-3.5" />, "Observations", overdue === 0 ? "None overdue" : `${overdue} overdue`, overdue === 0 ? "ok" : "warn")}
          {tile(<RefreshCw className="h-3.5 w-3.5" />, "Improvement cycles", awaitingDecision === 0 ? "None waiting on a decision" : `${awaitingDecision} waiting on a decision`, awaitingDecision === 0 ? "ok" : "warn")}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-sm">
            {next ? (
              <><span className="font-medium">Do this next:</span> {next.text}</>
            ) : (
              <span className="flex items-center gap-2 text-green-700 dark:text-green-300"><CheckCircle2 className="h-4 w-4" /> Numbers are current. Read the trend below.</span>
            )}
          </p>
          {next?.to && (
            <Button asChild size="sm" className="gap-1"><Link to={next.to}>Go <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          )}
          {next?.onClick && (
            <Button size="sm" className="gap-1" onClick={next.onClick}>Go <ArrowRight className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
