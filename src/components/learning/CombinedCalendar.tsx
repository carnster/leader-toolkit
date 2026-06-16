import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Download, GraduationCap, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/dates";
import { useToast } from "@/hooks/use-toast";

type Layer = "support" | "monitoring";
interface CalEvent {
  id: string;
  date: Date;
  dateStr: string;
  title: string;
  layer: Layer;
  kind: string;
  initiativeId: string;
  initiativeTitle: string;
  status?: string | null;
}

const LAYER_COLOR: Record<Layer, string> = {
  support: "hsl(var(--stage-plan))",
  monitoring: "hsl(var(--stage-decide))",
};

interface CombinedCalendarProps {
  initiatives: Array<{ id: string; title: string }>;
}

export function CombinedCalendar({ initiatives }: CombinedCalendarProps) {
  const { toast } = useToast();
  const ids = initiatives.map((i) => i.id).sort();
  const titleById = useMemo(
    () => Object.fromEntries(initiatives.map((i) => [i.id, i.title])),
    [initiatives]
  );

  const [showSupport, setShowSupport] = useState(true);
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [hiddenInitiatives, setHiddenInitiatives] = useState<Set<string>>(new Set());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["combined-calendar", ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<CalEvent[]> => {
      const out: CalEvent[] = [];
      const push = (
        rows: any[] | null,
        layer: Layer,
        kind: string,
        dateField: string,
        titleFn: (r: any) => string
      ) => {
        for (const r of rows || []) {
          const ds = r[dateField];
          if (!ds) continue;
          out.push({
            id: `${kind}-${r.id}`,
            date: parseDateOnly(ds),
            dateStr: String(ds).slice(0, 10),
            title: titleFn(r),
            layer,
            kind,
            initiativeId: r.initiative_id,
            initiativeTitle: titleById[r.initiative_id] || "Initiative",
            status: r.status ?? r.completion_status ?? null,
          });
        }
      };

      const [pd, comm, obs, ms, tm] = await Promise.all([
        supabase.from("pd_activities").select("id, initiative_id, scheduled_date, title, activity_type, completion_status").in("initiative_id", ids),
        supabase.from("communication_activities").select("id, initiative_id, scheduled_date, description, stakeholder_group").in("initiative_id", ids),
        supabase.from("observation_schedules").select("id, initiative_id, scheduled_date, observation_type, status").in("initiative_id", ids),
        supabase.from("timeline_milestones").select("id, initiative_id, target_date, milestone, status, phase").in("initiative_id", ids),
        supabase.from("team_meetings" as any).select("id, initiative_id, meeting_date, decisions").in("initiative_id", ids),
      ]);

      push(pd.data, "support", "Professional learning", "scheduled_date", (r) => r.title || "Professional learning");
      push(comm.data, "support", "Communication", "scheduled_date", (r) => r.description || "Communication");
      push(obs.data, "monitoring", "Observation", "scheduled_date", (r) => (r.observation_type ? `${r.observation_type} observation` : "Observation"));
      push(ms.data, "monitoring", "Milestone", "target_date", (r) => r.milestone || "Milestone");
      push(tm.data, "monitoring", "Team data meeting", "meeting_date", () => "Team meeting");
      return out;
    },
  });

  const filtered = useMemo(
    () =>
      events
        .filter((e) => (e.layer === "support" ? showSupport : showMonitoring))
        .filter((e) => !hiddenInitiatives.has(e.initiativeId))
        .sort((a, b) => a.dateStr.localeCompare(b.dateStr)),
    [events, showSupport, showMonitoring, hiddenInitiatives]
  );

  const byMonth = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: CalEvent[] }> = [];
    const map = new Map<string, CalEvent[]>();
    for (const e of filtered) {
      const key = format(e.date, "yyyy-MM");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    [...map.keys()].sort().forEach((key) => {
      const items = map.get(key)!;
      groups.push({ key, label: format(items[0].date, "MMMM yyyy"), items });
    });
    return groups;
  }, [filtered]);

  const supportCount = events.filter((e) => e.layer === "support").length;
  const monitoringCount = events.filter((e) => e.layer === "monitoring").length;

  const toggleInitiative = (id: string) =>
    setHiddenInitiatives((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportIcs = () => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export yet", description: "No scheduled supports or monitoring in view." });
      return;
    }
    const esc = (s: string) => (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const vevents = filtered.map((e) =>
      [
        "BEGIN:VEVENT",
        `UID:${e.id}@impact-companion`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${e.dateStr.replace(/-/g, "")}`,
        `SUMMARY:${esc(`[${e.kind}] ${e.title}`)}`,
        `DESCRIPTION:${esc(`${e.initiativeTitle} (${e.layer === "support" ? "support" : "monitoring"})`)}`,
        "END:VEVENT",
      ].join("\r\n")
    );
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//IMPACT Implementation Companion//EN",
      "X-WR-CALNAME:Monitoring and Supports",
      ...vevents,
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monitoring-and-supports.ics";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filtered.length} events exported`, description: "Open the .ics to import into Google, Outlook, or Apple Calendar." });
  };

  if (initiatives.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Select an initiative to see its calendar.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>Monitoring and Supports Calendar</CardTitle>
              <CardDescription>Every support and every check, across the year, on one calendar.</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportIcs}>
            <Download className="mr-2 h-4 w-4" />
            Export .ics
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend + layer filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showSupport ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSupport((v) => !v)}
            className="gap-2"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LAYER_COLOR.support }} />
            <GraduationCap className="h-3.5 w-3.5" /> Supports ({supportCount})
          </Button>
          <Button
            variant={showMonitoring ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMonitoring((v) => !v)}
            className="gap-2"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LAYER_COLOR.monitoring }} />
            <ClipboardCheck className="h-3.5 w-3.5" /> Monitoring ({monitoringCount})
          </Button>
        </div>

        {/* Initiative filters */}
        {initiatives.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            {initiatives.map((i) => {
              const on = !hiddenInitiatives.has(i.id);
              return (
                <Button key={i.id} variant={on ? "secondary" : "outline"} size="sm" onClick={() => toggleInitiative(i.id)} className="text-xs">
                  {i.title}
                </Button>
              );
            })}
          </div>
        )}

        {/* Agenda */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading calendar...</p>
        ) : byMonth.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No scheduled supports or monitoring in view. Add PD activities, observations, milestones, or team meetings to your
            initiatives and they will appear here.
          </p>
        ) : (
          <div className="space-y-5">
            {byMonth.map((group) => (
              <div key={group.key} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-1">{group.label}</h4>
                <div className="space-y-1.5">
                  {group.items.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 rounded-md border border-l-4 bg-card p-2.5"
                      style={{ borderLeftColor: LAYER_COLOR[e.layer] }}
                    >
                      <div className="w-14 flex-shrink-0 text-xs text-muted-foreground pt-0.5">
                        {format(e.date, "EEE d")}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{e.kind}</Badge>
                          <span className="text-sm font-medium">{e.title}</span>
                        </div>
                        {initiatives.length > 1 && (
                          <p className="text-xs text-muted-foreground truncate">{e.initiativeTitle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
