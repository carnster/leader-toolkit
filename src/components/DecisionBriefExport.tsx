import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DecisionBrief } from "@/hooks/useDecisionBrief";
import jsPDF from "jspdf";
import { brandedHeader, brandedFooter } from "@/lib/pdfBrand";

interface DecisionBriefExportProps {
  decisionBrief: DecisionBrief | null;
  initiativeTitle?: string;
}

export function DecisionBriefExport({ decisionBrief, initiativeTitle }: DecisionBriefExportProps) {
  const { toast } = useToast();

  const exportToPDF = () => {
    if (!decisionBrief) {
      toast({
        title: "No data to export",
        description: "Please save your decision brief first.",
        variant: "destructive",
      });
      return;
    }

    const placeholderPattern = /\[[^\]\n]{1,60}\]/;
    const fieldsToScan: (string | null | undefined)[] = [
      decisionBrief.problem_statement,
      decisionBrief.target_group,
      decisionBrief.goals,
      decisionBrief.chosen_approach,
      decisionBrief.evidence_base,
      ...(decisionBrief.leading_indicators || []),
      ...(decisionBrief.lagging_indicators || []),
      ...(decisionBrief.measurement_timeline || []),
    ];
    let firstMatch: string | null = null;
    for (const field of fieldsToScan) {
      if (!field) continue;
      const match = field.match(placeholderPattern);
      if (match) {
        firstMatch = match[0];
        break;
      }
    }
    if (firstMatch) {
      toast({
        title: "Replace the placeholders first",
        description: `This brief still contains template placeholders like ${firstMatch}. Fill them in before exporting, since this document is written for boards and authorizers.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPos = brandedHeader(doc, {
        title: "Decision Brief Summary",
        subtitle: initiativeTitle,
      });

      // Helper to add section
      const addSection = (title: string, content: string | null) => {
        if (!content) return;
        
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(title, margin, yPos);
        yPos += lineHeight;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(content, 170);
        lines.forEach((line: string) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += lineHeight;
        });
        yPos += lineHeight;
      };

      // Add sections
      addSection("Problem Statement", decisionBrief.problem_statement);
      addSection("Target Group", decisionBrief.target_group);
      addSection("Baseline Data", decisionBrief.baseline_data);
      addSection("Root Causes", decisionBrief.root_causes?.join(", ") || null);
      addSection("Goals", decisionBrief.goals);
      addSection("Chosen Approach", decisionBrief.chosen_approach);
      addSection("Evidence Base", decisionBrief.evidence_base);
      addSection("Stakeholder Input", decisionBrief.stakeholder_input);
      addSection("Equity Considerations", decisionBrief.equity_notes);
      
      if (decisionBrief.feasibility_score) {
        addSection("Feasibility Score", `${decisionBrief.feasibility_score}/10`);
      }
      
      addSection("Early Signs of Progress", decisionBrief.leading_indicators?.join(", ") || null);
      addSection("Longer-Term Outcome Measures", decisionBrief.lagging_indicators?.join(", ") || null);
      addSection("Measurement Timeline", decisionBrief.measurement_timeline?.join(", ") || null);

      brandedFooter(doc, initiativeTitle);

      // Save the PDF
      const fileName = initiativeTitle 
        ? `${initiativeTitle.replace(/[^a-z0-9]/gi, '_')}_decision_brief.pdf`
        : "decision_brief.pdf";
      doc.save(fileName);

      toast({
        title: "PDF exported",
        description: "Your decision brief has been downloaded.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportToPDF} size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
}