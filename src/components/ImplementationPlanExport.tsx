import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ericLabel } from "@/lib/ericClusters";

interface ImplementationPlanExportProps {
  initiativeTitle: string;
  activeIngredients: any[];
  strategies: any[];
  teamMembers: any[];
  timeCommitments: any[];
  communicationActivities: any[];
  milestones: any[];
  risks: any[];
  pdActivities: any[];
}

export function ImplementationPlanExport({
  initiativeTitle,
  activeIngredients,
  strategies,
  teamMembers,
  timeCommitments,
  communicationActivities,
  milestones,
  risks,
  pdActivities,
}: ImplementationPlanExportProps) {
  const { toast } = useToast();

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Implementation Plan", 105, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(16);
      doc.text(initiativeTitle, 105, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${format(new Date(), "PPP")}`, 105, yPos, { align: "center" });
      yPos += 15;

      // Section 1: Strategic Foundation
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Strategic Foundation", 14, yPos);
      yPos += 8;

      // Active Ingredients
      doc.setFontSize(12);
      doc.text("Active Ingredients", 14, yPos);
      yPos += 5;

      if (activeIngredients.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Name", "Type", "Description"]],
          body: activeIngredients.map((ing) => [
            ing.name,
            ing.is_core ? "CORE" : "ADAPTABLE",
            ing.description || "-",
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No active ingredients defined.", 14, yPos);
        yPos += 8;
      }

      // Implementation Strategies
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Implementation Strategies (ERIC)", 14, yPos);
      yPos += 5;

      if (strategies.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Strategy", "Category", "Responsible Party", "Status"]],
          body: strategies.map((strat) => [
            strat.strategy_name,
            ericLabel(strat.eric_category),
            strat.responsible_party || "Unassigned",
            strat.status.replace("_", " ").toUpperCase(),
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No implementation strategies defined.", 14, yPos);
        yPos += 8;
      }

      // Section 2: Team & Capacity
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. Team & Capacity", 14, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.text("Team Members", 14, yPos);
      yPos += 5;

      if (teamMembers.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Name", "Role", "Responsibilities"]],
          body: teamMembers.map((member) => [
            member.name || "N/A",
            member.role_in_initiative,
            member.responsibilities?.join(", ") || "-",
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No team members assigned.", 14, yPos);
        yPos += 8;
      }

      // Time Commitments
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Time Commitments by Role", 14, yPos);
      yPos += 5;

      if (timeCommitments.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Role", "Hours/Week", "Hours/Month", "Description"]],
          body: timeCommitments.map((tc) => [
            tc.role_name,
            tc.hours_per_week?.toString() || "-",
            tc.hours_per_month?.toString() || "-",
            tc.description || "-",
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No time commitments defined.", 14, yPos);
        yPos += 8;
      }

      // Section 3: Communication & Engagement
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. Communication & Engagement", 14, yPos);
      yPos += 8;

      if (communicationActivities.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Activity", "Type", "Stakeholder Group", "Scheduled Date", "Status"]],
          body: communicationActivities.map((comm) => [
            comm.description,
            comm.activity_type,
            comm.stakeholder_group,
            comm.scheduled_date ? format(new Date(comm.scheduled_date), "PP") : "TBD",
            comm.completed ? "Completed" : "Pending",
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No communication activities planned.", 14, yPos);
        yPos += 8;
      }

      // Section 4: Execution Planning
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("4. Execution Planning", 14, yPos);
      yPos += 8;

      // Milestones
      doc.setFontSize(12);
      doc.text("Timeline Milestones", 14, yPos);
      yPos += 5;

      if (milestones.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Milestone", "Phase", "Target Date", "Status"]],
          body: milestones.map((milestone) => [
            milestone.milestone,
            milestone.phase,
            format(new Date(milestone.target_date), "PP"),
            milestone.status.replace("_", " ").toUpperCase(),
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No milestones defined.", 14, yPos);
        yPos += 8;
      }

      // Risks
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Implementation Risks", 14, yPos);
      yPos += 5;

      if (risks.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Risk", "Category", "Impact", "Likelihood", "Mitigation"]],
          body: risks.map((risk) => [
            risk.risk_description,
            risk.risk_category,
            risk.impact.toUpperCase(),
            risk.likelihood.toUpperCase(),
            risk.mitigation_strategy,
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No risks identified.", 14, yPos);
        yPos += 8;
      }

      // Section 5: Professional Development
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("5. Professional Development", 14, yPos);
      yPos += 8;

      if (pdActivities.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Title", "Type", "Facilitator", "Scheduled Date", "Status"]],
          body: pdActivities.map((pd) => [
            pd.title,
            pd.activity_type,
            pd.facilitator || "TBD",
            pd.scheduled_date ? format(new Date(pd.scheduled_date), "PP") : "TBD",
            pd.completion_status.replace("_", " ").toUpperCase(),
          ]),
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No professional development activities planned.", 14, yPos);
        yPos += 8;
      }

      // Save PDF
      doc.save(`${initiativeTitle.replace(/[^a-z0-9]/gi, "_")}_Implementation_Plan.pdf`);

      toast({
        title: "Implementation Plan Exported",
        description: "Your comprehensive implementation plan has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the implementation plan PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={generatePDF} size="lg" className="gap-2">
      <Download className="h-4 w-4" />
      Export Implementation Plan
    </Button>
  );
}
