import { Button } from "@/components/ui/button";
import { FileStack } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/dates";
import { useToast } from "@/hooks/use-toast";
import { useDecisionBrief } from "@/hooks/useDecisionBrief";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useImplementationRisks } from "@/hooks/useImplementationRisks";
import { usePDActivities } from "@/hooks/usePDActivities";
import { useCommunicationActivities } from "@/hooks/useCommunicationActivities";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useIndicators } from "@/hooks/useIndicators";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { usePDSACycles } from "@/hooks/usePDSACycles";
import { useSustainabilityPlan } from "@/hooks/useSustainabilityPlan";
import { ericLabel } from "@/lib/ericClusters";

const NAVY: [number, number, number] = [12, 36, 84];
const CRIMSON: [number, number, number] = [168, 0, 0];

interface EvidencePackExportProps {
  initiativeId: string;
  initiativeTitle: string;
}

export function EvidencePackExport({ initiativeId, initiativeTitle }: EvidencePackExportProps) {
  const { toast } = useToast();
  const { decisionBrief } = useDecisionBrief(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);
  const { strategies } = useImplementationStrategies(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const { milestones } = useTimelineMilestones(initiativeId);
  const { risks } = useImplementationRisks(initiativeId);
  const { activities: pdActivities } = usePDActivities(initiativeId);
  const { activities: commActivities } = useCommunicationActivities(initiativeId);
  const { budgetItems } = useBudgetItems(initiativeId);
  const { indicators, indicatorValues } = useIndicators(initiativeId);
  const { fidelityLogs } = useFidelityLogs(initiativeId);
  const { pdsaCycles } = usePDSACycles(initiativeId);
  const { sustainabilityPlan } = useSustainabilityPlan(initiativeId);

  const handleExport = () => {
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      let y = 0;

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
      const table = (head: string[], body: (string | number)[][], emptyText: string) => {
        if (body.length === 0) {
          ensureRoom(14);
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(120, 120, 120);
          doc.text(emptyText, 14, y);
          y += 8;
          return;
        }
        autoTable(doc, {
          startY: y,
          head: [head],
          body,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: NAVY, textColor: 255 },
          margin: { left: 14, right: 14 },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      };

      // Cover
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 70, "F");
      doc.setTextColor(251, 250, 248);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Evidence Pack", pageW / 2, 32, { align: "center" });
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.text(initiativeTitle, pageW / 2, 44, { align: "center" });
      doc.setFontSize(9);
      doc.text(`Generated ${format(new Date(), "PPP")} · IMPACT Implementation Companion`, pageW / 2, 56, { align: "center" });
      y = 84;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      const intro = doc.splitTextToSize(
        "This pack combines the Decision Brief, the implementation plan, current monitoring data, and sustainability commitments for board and leadership review.",
        pageW - 28
      );
      doc.text(intro, 14, y);
      y += intro.length * 4.5 + 8;

      // 1. Decision Brief
      sectionTitle("1. Decision Brief");
      para("Problem Statement", decisionBrief?.problem_statement);
      para("Target Group", decisionBrief?.target_group);
      para("Baseline Data", decisionBrief?.baseline_data);
      para("Root Causes", decisionBrief?.root_causes?.join("; "));
      para("Goals", decisionBrief?.goals);
      para("Chosen Approach", decisionBrief?.chosen_approach);
      para("Evidence Base", decisionBrief?.evidence_base);
      para("Stakeholder Input & Organizational Context", decisionBrief?.stakeholder_input);
      if (decisionBrief?.feasibility_score != null) {
        para("Feasibility Score", `${decisionBrief.feasibility_score} of 5 (converted from five 1-10 factor ratings)`);
      }
      const eqNotes = decisionBrief?.equity_checklist?.notes || {};
      const eqRows = Object.entries(eqNotes).map(([k, v]) => [k.replace(/_/g, " "), v]);
      if (eqRows.length > 0 || decisionBrief?.equity_notes) {
        para("Equity & Inclusion", decisionBrief?.equity_notes || undefined);
        table(["Checklist Item", "Notes"], eqRows, "Equity checklist not completed.");
      }

      // 2. Implementation Plan
      doc.addPage();
      y = 20;
      sectionTitle("2. Implementation Plan");
      para("Active Ingredients", undefined);
      table(
        ["Component", "Type", "Description"],
        activeIngredients.map((i) => [i.name, i.is_core ? "CORE" : "Adaptable", i.description || ""]),
        "No active ingredients defined."
      );
      table(
        ["Strategy", "ERIC Cluster", "Target Barrier", "Status"],
        strategies.map((s) => [s.strategy_name, ericLabel(s.eric_category), s.target_barrier || "", s.status.replace("_", " ")]),
        "No implementation strategies defined."
      );
      table(
        ["Team Member", "Role", "Responsibilities"],
        teamMembers.map((m: any) => [m.profiles?.full_name || m.name || "", m.role_in_initiative || "", (m.responsibilities || []).join("; ")]),
        "No team members assigned."
      );
      table(
        ["Milestone", "Phase", "Target Date", "Status"],
        milestones.map((m) => [m.milestone, m.phase || "", m.target_date ? format(parseDateOnly(m.target_date), "PP") : "", m.status]),
        "No milestones defined."
      );
      table(
        ["Risk", "Likelihood", "Impact", "Mitigation"],
        risks.map((r) => [r.risk_description, r.likelihood, r.impact, r.mitigation_strategy || ""]),
        "No risks recorded."
      );
      table(
        ["PD Activity", "Type", "Scheduled", "Status"],
        pdActivities.map((p: any) => [p.title, p.activity_type, p.scheduled_date ? format(parseDateOnly(p.scheduled_date), "PP") : "", p.completion_status || ""]),
        "No professional development planned."
      );
      table(
        ["Communication", "Audience", "Scheduled"],
        commActivities.map((c: any) => [c.description, c.stakeholder_group || "", c.scheduled_date ? format(parseDateOnly(c.scheduled_date), "PP") : ""]),
        "No communication activities planned."
      );
      table(
        ["Budget Item", "Category", "Amount"],
        budgetItems.map((b: any) => [b.item_name || b.description || "", b.category || "", b.amount != null ? `$${Number(b.amount).toLocaleString()}` : ""]),
        "No budget items recorded."
      );

      // 3. Monitoring Data
      doc.addPage();
      y = 20;
      sectionTitle("3. Monitoring Data");
      const latestValue = (indicatorId: string) => {
        const vals = (indicatorValues as any[]).filter((v) => v.indicator_id === indicatorId);
        if (vals.length === 0) return "";
        const latest = vals.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
        return String(latest.value);
      };
      table(
        ["Indicator", "Type", "Latest Value", "Target"],
        indicators.map((i: any) => [i.name, i.type, latestValue(i.id), i.target_value != null ? String(i.target_value) : ""]),
        "No indicators defined."
      );
      const avgFidelity = fidelityLogs.length > 0
        ? (fidelityLogs.reduce((sum: number, l: any) => sum + (l.rating || 0), 0) / fidelityLogs.length).toFixed(1)
        : null;
      para("Fidelity Observations", fidelityLogs.length > 0
        ? `${fidelityLogs.length} observations recorded. Average rating ${avgFidelity} of 5.`
        : "No fidelity observations recorded yet.");
      table(
        ["PDSA Cycle", "Aim", "Status", "Decision"],
        (pdsaCycles as any[]).map((c) => [`Cycle ${c.cycle_number}`, c.aim || "", c.status || "", c.decision || ""]),
        "No improvement cycles run yet."
      );

      // 4. Sustainability
      sectionTitle("4. Spread & Sustain");
      const routines = (sustainabilityPlan?.embedding_routines as any[]) || [];
      table(
        ["Routine", "Schedule", "Owner"],
        routines.map((r) => [r.name || "", r.schedule || "", r.owner || ""]),
        "No embedding routines recorded yet."
      );
      const onboarding = (sustainabilityPlan?.onboarding_resources as any[]) || [];
      table(
        ["Onboarding Resource", "Status"],
        onboarding.map((o) => [o.name || "", o.status || ""]),
        "No onboarding resources recorded yet."
      );

      doc.save(`${initiativeTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-evidence-pack.pdf`);
      toast({
        title: "Evidence Pack exported",
        description: "Decision Brief, plan, monitoring data, and sustainability commitments in one PDF.",
      });
    } catch (error) {
      console.error("Evidence pack export failed:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate the Evidence Pack.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileStack className="mr-2 h-4 w-4" />
      Evidence Pack
    </Button>
  );
}
