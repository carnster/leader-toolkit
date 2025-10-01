import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Initiative } from '@/hooks/useInitiatives';
import { DecisionBrief } from '@/hooks/useDecisionBrief';
import { ActiveIngredient } from '@/hooks/useActiveIngredients';
import { Indicator, IndicatorValue } from '@/hooks/useIndicators';
import { PDSACycle } from '@/hooks/usePDSACycles';

export function exportDecisionBrief(
  initiative: Initiative,
  brief: DecisionBrief
) {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Decision Brief', 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.text(initiative.title, 20, yPos);
  yPos += 10;

  // Problem Statement
  doc.setFontSize(14);
  doc.text('Problem Statement', 20, yPos);
  yPos += 8;
  doc.setFontSize(10);
  const problemLines = doc.splitTextToSize(brief.problem_statement, 170);
  doc.text(problemLines, 20, yPos);
  yPos += problemLines.length * 5 + 5;

  // Target Group
  doc.setFontSize(12);
  doc.text('Target Group', 20, yPos);
  yPos += 6;
  doc.setFontSize(10);
  doc.text(brief.target_group, 20, yPos);
  yPos += 10;

  // Add more sections as needed...
  if (brief.evidence_base) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.text('Evidence Base', 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    const evidenceLines = doc.splitTextToSize(brief.evidence_base, 170);
    doc.text(evidenceLines, 20, yPos);
  }

  doc.save(`decision-brief-${initiative.title.replace(/\s+/g, '-')}.pdf`);
}

export function exportImplementationPlan(
  initiative: Initiative,
  ingredients: ActiveIngredient[]
) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Implementation Plan', 20, 20);
  
  doc.setFontSize(12);
  doc.text(initiative.title, 20, 30);

  // Active Ingredients Table
  doc.setFontSize(14);
  doc.text('Active Ingredients', 20, 45);

  const tableData = ingredients.map(ing => [
    ing.name,
    ing.category || '-',
    ing.is_core ? 'Core' : 'Adaptable',
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Component', 'Category', 'Type']],
    body: tableData,
  });

  doc.save(`implementation-plan-${initiative.title.replace(/\s+/g, '-')}.pdf`);
}

export function exportMonitoringReport(
  initiative: Initiative,
  indicators: Indicator[],
  indicatorValues: IndicatorValue[],
  pdsaCycles: PDSACycle[]
) {
  const doc = new jsPDF();
  let yPos = 20;

  doc.setFontSize(20);
  doc.text('Monitoring Report', 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.text(initiative.title, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
  yPos += 15;

  // Key Indicators
  doc.setFontSize(14);
  doc.text('Key Indicators', 20, yPos);
  yPos += 5;

  const indicatorData = indicators.map(ind => {
    const latestValue = indicatorValues
      .filter(v => v.indicator_id === ind.id)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
    
    return [
      ind.name,
      ind.type,
      latestValue ? latestValue.value.toString() : '-',
      ind.target_value?.toString() || '-',
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['Indicator', 'Type', 'Current', 'Target']],
    body: indicatorData,
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // PDSA Cycles
  if (pdsaCycles.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('PDSA Cycles', 20, yPos);
    yPos += 5;

    const pdsaData = pdsaCycles.map(cycle => [
      `Cycle ${cycle.cycle_number}`,
      cycle.aim,
      cycle.status,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Cycle', 'Aim', 'Status']],
      body: pdsaData,
    });
  }

  doc.save(`monitoring-report-${initiative.title.replace(/\s+/g, '-')}.pdf`);
}
