import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GaugeCircle, Users, LifeBuoy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { QueryErrorState } from "@/components/QueryErrorState";
import { usePulseCheckins, type PulseCheckin } from "@/hooks/usePulseCheckins";
import { useTeamMembers } from "@/hooks/useTeamMembers";

const USED_LABEL: Record<string, string> = { yes: "Yes", partly: "Partly", not_yet: "Not yet" };

function reason(c: PulseCheckin): string | null {
  if (c.used_status === "not_yet") return "not yet";
  if (c.traction <= 2) return `traction ${c.traction}`;
  if (c.needs_support && c.needs_support.trim()) return "asked for help";
  return null;
}

interface PulseDashboardProps {
  initiativeId: string;
}

export function PulseDashboard({ initiativeId }: PulseDashboardProps) {
  const { checkins, isError, weekOf } = usePulseCheckins(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);

  const thisWeek = useMemo(() => checkins.filter((c) => c.week_of === weekOf), [checkins, weekOf]);

  const teamSize = teamMembers.length || 0;
  // Each row is one response. Link pulses have a null respondent_id, so counting
  // rows (deduped per browser upstream) is correct where distinct-id would collapse them.
  const responses = thisWeek.length;
  const avgTraction =
    thisWeek.length > 0
      ? (thisWeek.reduce((s, c) => s + c.traction, 0) / thisWeek.length)
      : null;

  const needsSupport = useMemo(
    () => thisWeek.filter((c) => !!reason(c)).sort((a, b) => a.traction - b.traction),
    [thisWeek]
  );

  // Average traction per week for the trend sparkline (oldest to newest, last 8).
  const trend = useMemo(() => {
    const byWeek = new Map<string, number[]>();
    for (const c of checkins) {
      if (!byWeek.has(c.week_of)) byWeek.set(c.week_of, []);
      byWeek.get(c.week_of)!.push(c.traction);
    }
    return [...byWeek.entries()]
      .map(([week, vals]) => ({ week, avg: vals.reduce((s, v) => s + v, 0) / vals.length }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8)
      .map((d) => ({ ...d, label: format(parseISO(d.week), "MMM d") }));
  }, [checkins]);

  if (isError) {
    return <QueryErrorState title="We could not load the pulse" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Team pulse</CardTitle>
            <CardDescription>Where the team is this week, and who needs support.</CardDescription>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Week of {format(parseISO(weekOf), "MMM d")}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {thisWeek.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No pulses yet this week. As your team sends their weekly check-ins, participation, traction, and support
            requests appear here.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden="true" /> Staff responding
                </p>
                <p className="text-2xl font-bold text-primary tabular-nums mt-1">{responses}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  pulses this week{teamSize > 0 ? ` \u00b7 team of ${teamSize}` : ""}
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <GaugeCircle className="h-3 w-3" aria-hidden="true" /> Traction (avg)
                </p>
                <p className="text-2xl font-bold text-primary tabular-nums mt-1">
                  {avgTraction !== null ? avgTraction.toFixed(1) : "--"}
                  <span className="text-sm text-muted-foreground font-normal">/4</span>
                </p>
                {trend.length > 1 && (
                  <div className="h-8 mt-1 -mb-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                        <XAxis dataKey="label" hide />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                          formatter={(v: number) => [v.toFixed(1), "Avg traction"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="avg"
                          stroke="hsl(var(--stage-sustain))"
                          fill="hsl(var(--stage-sustain))"
                          fillOpacity={0.12}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className={`rounded-lg border p-3 ${needsSupport.length > 0 ? "border-destructive/30 bg-destructive/5" : ""}`}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <LifeBuoy className="h-3 w-3" aria-hidden="true" /> Needs support
                </p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${needsSupport.length > 0 ? "text-destructive" : "text-primary"}`}>
                  {needsSupport.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Flagged this week &middot; your coaching queue</p>
              </div>
            </div>

            {needsSupport.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Who needs support this week</h4>
                <div className="space-y-2">
                  {needsSupport.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-lg border border-l-[3px] border-l-destructive p-3">
                      <div className="min-w-[120px]">
                        <p className="text-sm font-medium">{c.respondent_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">Marked {USED_LABEL[c.used_status]}</p>
                      </div>
                      <p className="text-sm text-muted-foreground flex-1">
                        {c.needs_support?.trim() || "No note left; low traction reported."}
                      </p>
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40 self-center whitespace-nowrap">
                        {reason(c)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
