import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardStats } from "@/hooks/useDashboardAnalytics";
import { Initiative } from "@/hooks/useInitiatives";

interface DashboardExportProps {
  analytics: DashboardStats | undefined;
  initiatives: Initiative[];
  selectedInitiativeId?: string;
}

export function DashboardExport({ analytics, initiatives, selectedInitiativeId }: DashboardExportProps) {
  const [exporting, setExporting] = useState(false);

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

      // Initiatives Table
      if (initiatives.length > 0) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

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
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

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
