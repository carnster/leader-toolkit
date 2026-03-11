import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardStats } from "@/hooks/useDashboardAnalytics";
import { Initiative } from "@/hooks/useInitiatives";
import { FidelityTrendData } from "@/hooks/useFidelityTrends";
import { BudgetSummary } from "@/hooks/useBudgetTracking";

interface DashboardExportProps {
  analytics: DashboardStats | undefined;
  initiatives: Initiative[];
  selectedInitiativeId?: string;
  fidelityTrends?: FidelityTrendData[];
  budgetData?: BudgetSummary[];
}

export function DashboardExport({ analytics, initiatives, selectedInitiativeId, fidelityTrends, budgetData }: DashboardExportProps) {
  const [exporting, setExporting] = useState(false);

  const checkPageBreak = (doc: jsPDF, yPos: number, needed: number = 40): number => {
    if (yPos + needed > 270) {
      doc.addPage();
      return 20;
    }
    return yPos;
  };

  const handleExport = () => {
    if (!analytics) {
      toast.error("No data available to export");
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Implementation Dashboard Report", 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 20, yPos);
      yPos += 5;

      const selectedInitiative = selectedInitiativeId
        ? initiatives.find(i => i.id === selectedInitiativeId)
        : null;
      doc.text(selectedInitiative ? `Initiative: ${selectedInitiative.title}` : "Scope: All Initiatives", 20, yPos);
      yPos += 10;

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;

      // Key Metrics Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Key Metrics", 20, yPos);
      yPos += 10;

      const metricsData = [
        ["Active Initiatives", `${analytics.activeInitiatives} of ${analytics.totalInitiatives}`],
        ["Average Fidelity", analytics.avgFidelityScore ? `${analytics.avgFidelityScore}/5` : "N/A"],
        ["Team Members", analytics.totalTeamMembers.toString()],
        ["Upcoming Deadlines (7 days)", analytics.upcomingDeadlines.toString()],
        ["Milestones Completed", `${analytics.completedMilestones} of ${analytics.totalMilestones}`],
        ["On Track", analytics.onTrackInitiatives.toString()],
        ["At Risk", analytics.atRiskInitiatives.toString()],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Metric", "Value"]],
        body: metricsData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 100 } },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Initiative Health
      if (analytics.totalInitiatives > 0) {
        const healthScore = Math.round((analytics.onTrackInitiatives / analytics.totalInitiatives) * 100);
        const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Attention";

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Initiative Health", 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Overall Health Score: ${healthScore}% (${healthLabel})`, 20, yPos);
        yPos += 15;
      }

      // Fidelity Trends Table
      if (fidelityTrends && fidelityTrends.length > 0) {
        yPos = checkPageBreak(doc, yPos, 50);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Fidelity Trends (Last 30 Days)", 20, yPos);
        yPos += 5;

        const trendRows = fidelityTrends.map(t => [
          t.date,
          t.avgRating.toFixed(1),
          t.observationCount.toString(),
        ]);

        // Summary row
        const overallAvg = fidelityTrends.reduce((s, t) => s + t.avgRating, 0) / fidelityTrends.length;
        const totalObs = fidelityTrends.reduce((s, t) => s + t.observationCount, 0);

        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Avg Rating (out of 5)", "Observations"]],
          body: trendRows,
          foot: [["Overall", overallAvg.toFixed(1), totalObs.toString()]],
          theme: "grid",
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
          footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          styles: { fontSize: 9, cellPadding: 4 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Budget Tracking Table
      if (budgetData && budgetData.length > 0) {
        yPos = checkPageBreak(doc, yPos, 50);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Budget Tracking", 20, yPos);
        yPos += 5;

        const budgetRows = budgetData.map(b => [
          b.initiativeTitle.length > 30 ? b.initiativeTitle.substring(0, 30) + "..." : b.initiativeTitle,
          `$${b.totalEstimated.toLocaleString()}`,
          `$${b.totalActual.toLocaleString()}`,
          `$${b.variance.toLocaleString()}`,
          `${b.variancePercentage}%`,
        ]);

        const totalEst = budgetData.reduce((s, b) => s + b.totalEstimated, 0);
        const totalAct = budgetData.reduce((s, b) => s + b.totalActual, 0);
        const totalVar = totalEst - totalAct;
        const totalVarPct = totalEst > 0 ? Math.round((totalVar / totalEst) * 100) : 0;

        autoTable(doc, {
          startY: yPos,
          head: [["Initiative", "Estimated", "Actual", "Variance", "Variance %"]],
          body: budgetRows,
          foot: [["Total", `$${totalEst.toLocaleString()}`, `$${totalAct.toLocaleString()}`, `$${totalVar.toLocaleString()}`, `${totalVarPct}%`]],
          theme: "grid",
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: "bold" },
          footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: { 0: { cellWidth: 55 } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Initiatives Table
      if (initiatives.length > 0) {
        yPos = checkPageBreak(doc, yPos, 50);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Initiatives Overview", 20, yPos);
        yPos += 5;

        const stageMap: Record<string, string> = {
          decide: "Decide", plan: "Plan", implement: "Implement",
          monitor: "Monitor", sustain: "Sustain",
        };

        const filteredInitiatives = selectedInitiativeId
          ? initiatives.filter(i => i.id === selectedInitiativeId)
          : initiatives;

        const initiativeData = filteredInitiatives.map(init => [
          init.title,
          stageMap[init.stage] || init.stage,
          init.status.charAt(0).toUpperCase() + init.status.slice(1),
          init.target_end_date ? new Date(init.target_end_date).toLocaleDateString() : "-",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Initiative", "Stage", "Status", "Target Date"]],
          body: initiativeData,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: { 0: { cellWidth: 70 } },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Summary Footer
      yPos = checkPageBreak(doc, yPos, 20);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("This report was generated from the Implementation Dashboard.", 20, yPos);
      yPos += 5;
      doc.text("Data reflects the state at the time of export.", 20, yPos);

      const fileName = selectedInitiative
        ? `dashboard-report-${selectedInitiative.title.replace(/\s+/g, "-")}.pdf`
        : `dashboard-report-${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.save(fileName);
      toast.success("Dashboard report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export dashboard report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      <Download className="mr-2 h-4 w-4" />
      {exporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}
