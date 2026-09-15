import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePulseCheckins, currentWeekOf } from "@/hooks/usePulseCheckins";
import { useCommitments } from "@/hooks/useCommitments";
import { useCoachingCycles } from "@/hooks/useCoachingCycles";
import { useToast } from "@/hooks/use-toast";

/** One-page, auto-assembled agenda for the implementation team meeting.
 *  The app already holds everything the meeting needs; a leader should not
 *  have to open five pages to prep it. Read-only aggregation, no new tables. */

interface Stat { label: string; value: string; warn?: boolean }

function statLink(label: string, initiativeId?: string): string | undefined {
  if (!initiativeId) return undefined;
  const q = `?initiative=${initiativeId}`;
  if (label.startsWith("Pulse") || label.startsWith("Avg traction") || label.startsWith("Support") || label.includes("commitment")) return `/implement${q}`;
  if (label.startsWith("Coaching")) return `/learning${q}`;
  if (label.includes("milestone")) return `/plan?section=timeline&initiative=${initiativeId}`;
  if (label.startsWith("Adaptation")) return `/plan?section=adaptation&initiative=${initiativeId}`;
  if (label.startsWith("PD")) return `/plan?section=pd&initiative=${initiativeId}`;
  return undefined;
}

function useBriefData(initiativeId: string | undefined) {
  return useQuery({
    queryKey: ["meeting-brief", initiativeId],
    enabled: !!initiativeId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [milestones, adaptations, pd] = await Promise.all([
        supabase.from("timeline_milestones").select("milestone, target_date, status").eq("initiative_id", initiativeId!),
        supabase.from("adaptation_requests").select("id, decision").eq("initiative_id", initiativeId!),
        supabase.from("pd_activities").select("id, completion_status").eq("initiative_id", initiativeId!),
      ]);
      // Supabase selects resolve (never reject) on Postgres errors, so an
      // unchecked .data would render a failed query as a confident zero: a
      // false all-clear in a brief that exists to surface problems. Track
      // per-source validity and drop the stat rather than fake it.
      const msOk = !milestones.error;
      const adOk = !adaptations.error;
      const pdOk = !pd.error;
      const ms = msOk ? ((milestones.data as any[]) || []) : [];
      const overdueMilestones = ms.filter((m) => m.status !== "completed" && m.target_date && m.target_date < today);
      const adRows = adOk ? ((adaptations.data as any[]) || []) : [];
      const pdRows = pdOk ? ((pd.data as any[]) || []) : [];
      return {
        msOk,
        adOk,
        pdOk,
        overdueMilestones,
        milestonesTotal: ms.length,
        pendingAdaptations: adRows.filter((a) => a.decision === "pending").length,
        pdCompleted: pdRows.filter((p) => p.completion_status === "completed").length,
        pdTotal: pdRows.length,
      };
    },
  });
}

export function MeetingBrief({ initiativeId }: { initiativeId: string | undefined }) {
  const { checkins } = usePulseCheckins(initiativeId);
  const { open: openCommitments, missingTable: commitmentsMissing } = useCommitments(initiativeId);
  const { openCycles, missingTable: coachingMissing } = useCoachingCycles(initiativeId);
  const { data: brief } = useBriefData(initiativeId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const weekOf = currentWeekOf();

  const pulse = useMemo(() => {
    const thisWeek = checkins.filter((c) => c.week_of === weekOf);
    const flags = thisWeek.filter((c) => (c.needs_support && c.needs_support.trim()) || c.traction <= 2);
    const avg = thisWeek.length ? thisWeek.reduce((s, c) => s + c.traction, 0) / thisWeek.length : null;
    return { responses: thisWeek.length, flags: flags.length, avg };
  }, [checkins, weekOf]);

  const overdueCommitments = openCommitments.filter((c) => c.due_date && c.due_date < today);
  const followUpsDue = openCycles.filter((c) => c.stage === "follow_up" && c.follow_up_date && c.follow_up_date <= today);

  const stats: Stat[] = [
    { label: "Pulse responses this week", value: String(pulse.responses) },
    { label: "Avg traction", value: pulse.avg != null ? `${pulse.avg.toFixed(1)}/4` : "–", warn: pulse.avg != null && pulse.avg < 2.5 },
    { label: "Support flags", value: String(pulse.flags), warn: pulse.flags > 0 },
    ...(commitmentsMissing ? [] : [
      { label: "Open commitments", value: String(openCommitments.length) },
      { label: "Overdue commitments", value: String(overdueCommitments.length), warn: overdueCommitments.length > 0 },
    ]),
    ...(coachingMissing ? [] : [
      { label: "Coaching follow-ups due", value: String(followUpsDue.length), warn: followUpsDue.length > 0 },
    ]),
    ...(brief?.msOk ? [
      { label: "Overdue milestones", value: String(brief.overdueMilestones.length), warn: brief.overdueMilestones.length > 0 },
    ] : []),
    ...(brief?.adOk ? [
      { label: "Adaptation requests pending", value: String(brief.pendingAdaptations), warn: brief.pendingAdaptations > 0 },
    ] : []),
    ...(brief?.pdOk ? [
      { label: "PD completed", value: brief.pdTotal ? `${brief.pdCompleted}/${brief.pdTotal}` : "–" },
    ] : []),
  ];

  const toMarkdown = () => {
    const lines: string[] = [
      `# Implementation team brief: week of ${weekOf}`,
      "",
      `- Pulse: ${pulse.responses} responses, avg traction ${pulse.avg != null ? pulse.avg.toFixed(1) + "/4" : "n/a"}, ${pulse.flags} support flag(s)`,
    ];
    if (!commitmentsMissing) {
      lines.push(`- Commitments: ${openCommitments.length} open, ${overdueCommitments.length} overdue`);
      overdueCommitments.slice(0, 5).forEach((c) => lines.push(`  - OVERDUE: ${c.title}${c.owner_name ? ` (${c.owner_name})` : ""}, due ${c.due_date}`));
    }
    if (!coachingMissing && followUpsDue.length) {
      lines.push(`- Coaching follow-ups due: ${followUpsDue.map((c) => c.member_name).join(", ")}`);
    }
    if (brief?.msOk) {
      lines.push(`- Milestones: ${brief.overdueMilestones.length} overdue of ${brief.milestonesTotal}`);
      brief.overdueMilestones.slice(0, 5).forEach((m: any) => lines.push(`  - OVERDUE: ${m.milestone} (target ${m.target_date})`));
    }
    if (brief?.adOk) lines.push(`- Adaptation requests pending decision: ${brief.pendingAdaptations}`);
    if (brief?.pdOk) lines.push(`- PD: ${brief.pdCompleted}/${brief.pdTotal} completed`);
    lines.push("", "## Agenda", "1. Celebrate: what moved since last meeting", "2. Review flags and overdue items above; each leaves with an owner and a date", "3. Decide: pending adaptations", "4. Confirm next week's focus practice");
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", description: "Select and copy the brief manually.", variant: "destructive" });
    }
  };

  if (!initiativeId) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
              This week&apos;s meeting, drafted for you
            </CardTitle>
            <CardDescription className="mt-1">
              Auto-assembled from this week's data. Walk in prepared without opening five pages.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? "Copied" : "Copy as agenda"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => {
            const to = statLink(s.label, initiativeId);
            const warnCls = s.warn ? "border-amber-500/50 bg-amber-500/10" : "";
            const inner = (
              <>
                <p className={`text-2xl font-bold ${s.warn ? "text-amber-700 dark:text-amber-400" : ""}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </>
            );
            return to ? (
              <Link key={s.label} to={to} title={`Open ${s.label.toLowerCase()}`}
                className={`rounded-lg border p-3 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${warnCls}`}>
                {inner}
              </Link>
            ) : (
              <div key={s.label} className={`rounded-lg border p-3 ${warnCls}`}>{inner}</div>
            );
          })}
        </div>
        {brief && brief.overdueMilestones.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Overdue: {brief.overdueMilestones.slice(0, 3).map((m: any) => m.milestone).join(" · ")}
            {brief.overdueMilestones.length > 3 && ` · +${brief.overdueMilestones.length - 3} more`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
