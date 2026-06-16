import jsPDF from "jspdf";
import type { LearningPlan } from "@/hooks/useLearningPlans";

const NAVY: [number, number, number] = [12, 36, 84];
const CRIMSON: [number, number, number] = [168, 0, 0];
const SLATE: [number, number, number] = [91, 100, 112];

// A clean, shareable, text-based PDF of the year-long professional learning plan.
export function exportLearningPlanPdf(plan: LearningPlan) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const text = (
    s: string,
    opts: { size?: number; color?: [number, number, number]; bold?: boolean; gap?: number; indent?: number } = {}
  ) => {
    const { size = 10, color = [20, 24, 31], bold = false, gap = 4, indent = 0 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(s, contentW - indent);
    for (const line of lines) {
      ensure(size + 2);
      doc.text(line, margin + indent, y);
      y += size + 2;
    }
    y += gap;
  };

  // Header
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, pageW, 6, "F");
  text(plan.title, { size: 18, color: NAVY, bold: true, gap: 2 });
  if (plan.school_year_start) text(`Year beginning ${plan.school_year_start}`, { size: 10, color: SLATE, gap: 10 });

  const d = plan.plan_data;
  text("The year at a glance", { size: 12, color: CRIMSON, bold: true });
  text(d.overview || "", { size: 10, gap: 8 });
  if (d.themes && d.themes.length) text("Themes: " + d.themes.join("  |  "), { size: 9, color: SLATE, gap: 10 });

  if (d.coordination_notes && d.coordination_notes.length) {
    text("Coordinating across initiatives", { size: 12, color: CRIMSON, bold: true });
    for (const n of d.coordination_notes) text("• " + n, { size: 10, gap: 2, indent: 6 });
    y += 6;
  }

  for (const p of d.periods || []) {
    ensure(40);
    text(`${p.label}  (${p.timeframe})`, { size: 12, color: NAVY, bold: true, gap: 2 });
    if (p.focus) text(p.focus, { size: 9, color: SLATE, gap: 6 });
    for (const s of p.sessions || []) {
      ensure(50);
      text(s.title, { size: 10.5, bold: true, gap: 2, indent: 6 });
      if (s.capability) text("Builds: " + s.capability, { size: 9, color: SLATE, gap: 1, indent: 12 });
      const meta = [s.modality && `Modality: ${s.modality}`, s.audience && `Who: ${s.audience}`, s.cadence && `Cadence: ${s.cadence}`]
        .filter(Boolean)
        .join("   ");
      if (meta) text(meta, { size: 9, color: SLATE, gap: 1, indent: 12 });
      if (s.initiatives && s.initiatives.length) text("Serves: " + s.initiatives.join(", "), { size: 8.5, color: SLATE, gap: 1, indent: 12 });
      if (s.rationale) text(s.rationale, { size: 8.5, color: SLATE, gap: 6, indent: 12 });
    }
    y += 6;
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
    doc.text("IMPACT Implementation Companion  |  Professional Learning Plan", margin, pageH - 24);
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 24, { align: "right" });
  }

  doc.save(`${plan.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`);
}
