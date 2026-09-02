import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import { brandedHeader, brandedFooter, loadOrgLogoForPdf } from "@/lib/pdfBrand";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/dates";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMyOrgId } from "@/hooks/useOrganization";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { usePulseCheckins } from "@/hooks/usePulseCheckins";
import { useCommitments } from "@/hooks/useCommitments";
import { useIndicators } from "@/hooks/useIndicators";

const NAVY: [number, number, number] = [12, 36, 84];
const CRIMSON: [number, number, number] = [168, 0, 0];

const STAGE_LABEL: Record<string, string> = {
  decide: "Decide",
  plan: "Plan",
  implement: "Implement",
  monitor: "Monitor",
  sustain: "Sustain",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const MILESTONE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  at_risk: "At risk",
};

// Indicator names that signal a student-group breakdown. Equity reporting is
// only ever drawn from indicators that are actually disaggregated; a breakdown
// the data does not contain is never synthesized. Short acronyms are padded
// with spaces so they match as whole words, not inside longer words.
const EQUITY_TERMS = [
  "black", "african american", "latino", "latina", "latinx", "hispanic",
  "white", "asian", "native", "indigenous", "pacific islander", "multiracial",
  "race", "ethnic", "gender", "male", "female", "nonbinary",
  "multilingual", "english learner", "emergent bilingual", " ell ", " el ",
  "iep", " 504 ", "students with disabilities", "special education", " sped ",
  "free and reduced", "free or reduced", " frl ", "low income", "low-income",
  "economically disadvantaged", "poverty", "homeless", "foster",
  "subgroup", "student group", "disaggregat", "by group",
];

interface BoardReportExportProps {
  initiativeId: string;
  initiativeTitle: string;
}

/** A one-click summary of an initiative for board and authorizer review.
 *  Pulls only what already exists in the toolkit and frames pulse and fidelity
 *  as engagement and where to focus, not compliance or surveillance. */
export function BoardReportExport({ initiativeId, initiativeTitle }: BoardReportExportProps) {
  const { toast } = useToast();
  const { initiatives } = useInitiatives();
  const { decisionBrief } = useDecisionBrief(initiativeId);
  const { milestones } = useTimelineMilestones(initiativeId);
  const { fidelityLogs } = useFidelityLogs(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);
  const { checkins, weekOf } = usePulseCheckins(initiativeId);
  const { commitments } = useCommitments(initiativeId);
  const { indicators, indicatorValues } = useIndicators(initiativeId);

  const handleExport = async () => {
    try {
      const initiative = initiatives.find((i) => i.id === initiativeId) || null;

      // Best-effort: a school without a logo, or a fetch/decode failure,
      // must never block the export.
      let orgLogo = null;
      try {
        const orgId = await getMyOrgId(supabase);
        if (orgId) {
          const { data: orgRow } = await (supabase.from("organizations" as any) as any)
            .select("logo_url")
            .eq("id", orgId)
            .maybeSingle();
          if (orgRow?.logo_url) orgLogo = await loadOrgLogoForPdf(orgRow.logo_url);
        }
      } catch {
        /* logo is a nice-to-have on this report, not a requirement */
      }

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();

      let y = brandedHeader(doc, {
        title: "Board Report",
        subtitle: initiativeTitle,
        orgLogo,
      });

      const ensureRoom = (needed = 30) => {
        if (y > doc.internal.pageSize.getHeight() - needed) {
          doc.addPage();
          y = 20;
        }
      };
      const sectionTitle = (text: string) => {
        ensureRoom(40);
        doc.setFontSize(15);
        doc.setTextColor(...NAVY);
        doc.setFont("helvetica", "bold");
        doc.text(text, 14, y);
        doc.setDrawColor(...CRIMSON);
        doc.setLineWidth(0.8);
        doc.line(14, y + 2, 60, y + 2);
        y += 10;
      };
      const para = (label: string, value: string | null | undefined) => {
        if (!value) return;
        ensureRoom(26);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(label, 14, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 4;
      };
      const table = (
        head: string[],
        body: (string | number)[][],
        opts?: { rightCols?: number[] }
      ) => {
        if (body.length === 0) return;
        const columnStyles: Record<number, { halign: "right" }> = {};
        for (const c of opts?.rightCols || []) columnStyles[c] = { halign: "right" };
        autoTable(doc, {
          startY: y,
          head: [head],
          body,
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 2.5 },
          headStyles: { fillColor: NAVY, textColor: 255 },
          columnStyles,
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      };

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneLine = (s: string | null | undefined) => {
        if (!s) return undefined;
        const flat = s.replace(/\s+/g, " ").trim();
        return flat.length > 200 ? `${flat.slice(0, 197)}...` : flat;
      };

      // Shared computations ------------------------------------------------
      const milestonesDone = milestones.filter((m) => m.status === "completed").length;
      const isMilestoneOverdue = (m: (typeof milestones)[number]) =>
        m.status !== "completed" && m.target_date &&
        parseDateOnly(m.target_date).getTime() < todayStart.getTime();

      const avgFidelityAll = fidelityLogs.length > 0
        ? fidelityLogs.reduce((sum, l) => sum + (l.rating || 0), 0) / fidelityLogs.length
        : null;

      const pulseThisPeriod = checkins.filter((c) => c.week_of === weekOf);
      const avgTraction = pulseThisPeriod.length > 0
        ? pulseThisPeriod.reduce((sum, c) => sum + (c.traction || 0), 0) / pulseThisPeriod.length
        : null;

      const doneCommitments = commitments.filter((c) => c.status === "done");
      const openCommitments = commitments.filter((c) => c.status === "open");
      const overdueCommitments = openCommitments.filter(
        (c) => c.due_date && parseDateOnly(c.due_date).getTime() < todayStart.getTime()
      );

      const latestValue = (indicatorId: string): string => {
        const match = indicatorValues.find((v) => v.indicator_id === indicatorId);
        return match ? String(match.value) : "Not recorded";
      };

      // 1. At a glance -----------------------------------------------------
      sectionTitle("At a glance");
      para("Problem statement", oneLine(decisionBrief?.problem_statement));
      const glance: (string | number)[][] = [
        ["Stage", initiative ? STAGE_LABEL[initiative.stage] || initiative.stage : "Not set"],
        ["Status", initiative ? STATUS_LABEL[initiative.status] || initiative.status : "Not set"],
      ];
      if (milestones.length > 0) {
        glance.push(["Milestones complete", `${milestonesDone} of ${milestones.length}`]);
      }
      if (avgFidelityAll !== null) {
        glance.push(["Average fidelity", `${avgFidelityAll.toFixed(1)} of 5`]);
      }
      if (pulseThisPeriod.length > 0) {
        glance.push(["Pulse participation this period", `${pulseThisPeriod.length}`]);
      }
      if (commitments.length > 0) {
        glance.push([
          "Commitments",
          `${openCommitments.length} open, ${overdueCommitments.length} overdue`,
        ]);
      }
      table(["Measure", "Value"], glance, { rightCols: [1] });

      // 2. Milestone progress ---------------------------------------------
      if (milestones.length > 0) {
        sectionTitle("Milestone progress");
        table(
          ["Milestone", "Target date", "Status"],
          milestones.map((m) => {
            const statusText = MILESTONE_STATUS_LABEL[m.status] || m.status;
            return [
              m.milestone,
              m.target_date ? format(parseDateOnly(m.target_date), "PP") : "Not set",
              isMilestoneOverdue(m) ? `${statusText} (Overdue)` : statusText,
            ];
          })
        );
      }

      // 3. Fidelity trend --------------------------------------------------
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const recentLogs = fidelityLogs
        .filter((l) => new Date(l.observed_at).getTime() >= cutoff.getTime())
        .sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime());

      if (recentLogs.length > 0) {
        sectionTitle("Fidelity trend");
        const avgRecent =
          recentLogs.reduce((sum, l) => sum + (l.rating || 0), 0) / recentLogs.length;

        // Direction compares the average of the first half of the 30-day
        // window with the average of the second half. It needs at least two
        // observations to have two halves to compare.
        let direction = "holding steady";
        if (recentLogs.length >= 2) {
          const mid = Math.floor(recentLogs.length / 2);
          const firstHalf = recentLogs.slice(0, mid);
          const secondHalf = recentLogs.slice(mid);
          const avgOf = (arr: typeof recentLogs) =>
            arr.reduce((sum, l) => sum + (l.rating || 0), 0) / arr.length;
          const delta = avgOf(secondHalf) - avgOf(firstHalf);
          if (delta > 0.05) direction = "moving up";
          else if (delta < -0.05) direction = "trending down";
        }

        const obsWord = recentLogs.length === 1 ? "observation" : "observations";
        para(
          "Last 30 days",
          `The team recorded ${recentLogs.length} fidelity ${obsWord}, with an average rating of ${avgRecent.toFixed(1)} of 5. Compared with the first half of this window, the practice is ${direction}. Fidelity data shows where to focus coaching support, not who to hold accountable.`
        );

        const byIngredient = new Map<string, { name: string; sum: number; count: number }>();
        for (const log of recentLogs) {
          const key = log.component_id ?? "general";
          const name = log.component_id
            ? activeIngredients.find((a) => a.id === log.component_id)?.name ?? "Unlabeled practice"
            : "General observation";
          const entry = byIngredient.get(key) ?? { name, sum: 0, count: 0 };
          entry.sum += log.rating || 0;
          entry.count += 1;
          byIngredient.set(key, entry);
        }
        table(
          ["Practice", "Observations", "Average rating (of 5)"],
          Array.from(byIngredient.values()).map((e) => [
            e.name,
            String(e.count),
            (e.sum / e.count).toFixed(1),
          ]),
          { rightCols: [1, 2] }
        );
      }

      // 4. Staff pulse -----------------------------------------------------
      if (pulseThisPeriod.length > 0) {
        sectionTitle("Staff pulse");
        const memberWord = pulseThisPeriod.length === 1 ? "team member" : "team members";
        const tractionText =
          avgTraction !== null ? ` Average traction reported was ${avgTraction.toFixed(1)} of 4.` : "";
        para(
          `Week of ${format(parseDateOnly(weekOf), "PP")}`,
          `${pulseThisPeriod.length} ${memberWord} shared a pulse this period.${tractionText} Pulses are a voluntary read on how the work is landing and where the team needs support, not a measure of individual performance.`
        );
      }

      // 5. Commitments kept ------------------------------------------------
      if (commitments.length > 0) {
        sectionTitle("Commitments kept");
        para(
          "Follow-through",
          `${doneCommitments.length} commitment${doneCommitments.length === 1 ? "" : "s"} completed, ${openCommitments.length} open, ${overdueCommitments.length} overdue.`
        );
        const recentlyDone = [...doneCommitments]
          .sort(
            (a, b) =>
              new Date(b.resolved_at || b.created_at).getTime() -
              new Date(a.resolved_at || a.created_at).getTime()
          )
          .slice(0, 8);
        table(
          ["Owner", "Completed commitment"],
          recentlyDone.map((c) => [c.owner_name || "Unassigned", c.title])
        );
      }

      // 6. Equity indicators ----------------------------------------------
      sectionTitle("Equity indicators");
      const equityIndicators = indicators.filter((i) => {
        const hay = ` ${i.name.toLowerCase()} `;
        return EQUITY_TERMS.some((t) => hay.includes(t));
      });
      if (equityIndicators.length > 0) {
        para("Tracked by student group", undefined);
        table(
          ["Indicator", "Latest value", "Target"],
          equityIndicators.map((i) => [
            i.name,
            latestValue(i.id),
            i.target_value != null ? String(i.target_value) : "Not set",
          ]),
          { rightCols: [1, 2] }
        );
      } else {
        para(
          "In setup",
          "Equity monitoring is in setup. No indicators are currently disaggregated by student group, so no equity breakdown is reported here."
        );
      }

      brandedFooter(doc, initiativeTitle);
      const slug = initiativeTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      doc.save(`${slug}-board-report.pdf`);
      toast({
        title: "Board Report exported",
        description: "A branded summary for board and authorizer review.",
      });
    } catch (error) {
      console.error("Board report export failed:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate the Board Report.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileText className="mr-2 h-4 w-4" />
      Board Report
    </Button>
  );
}
