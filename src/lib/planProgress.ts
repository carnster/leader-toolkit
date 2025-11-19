import type { TeamMember } from "@/hooks/useTeamMembers";
import type { PDActivity } from "@/hooks/usePDActivities";

export interface CompletionCounts {
  ingredients: number;
  strategies: number;
  team: number;
  pd: number;
  communication: number;
  timeline: number;
  risks: number;
  fidelity: number;
}

export interface SectionProgress {
  section: string;
  label: string;
  completed: number;
  total: number;
  percentage: number;
  items: { name: string; completed: boolean }[];
}

export function calculateSectionProgress(
  section: string,
  counts: CompletionCounts
): SectionProgress {
  switch (section) {
    case "strategic":
      return {
        section: "strategic",
        label: "Strategic Foundation",
        completed: Math.min(counts.ingredients, 1) + Math.min(counts.strategies, 1),
        total: 2,
        percentage: ((Math.min(counts.ingredients, 1) + Math.min(counts.strategies, 1)) / 2) * 100,
        items: [
          { name: "Active Ingredients", completed: counts.ingredients > 0 },
          { name: "Implementation Strategies", completed: counts.strategies > 0 },
        ],
      };
    case "team":
      return {
        section: "team",
        label: "Team & Capacity",
        completed: Math.min(counts.team, 1) + Math.min(counts.pd, 1),
        total: 2,
        percentage: ((Math.min(counts.team, 1) + Math.min(counts.pd, 1)) / 2) * 100,
        items: [
          { name: "Team Members", completed: counts.team > 0 },
          { name: "Professional Development", completed: counts.pd > 0 },
        ],
      };
    case "communication":
      return {
        section: "communication",
        label: "Communication",
        completed: Math.min(counts.communication, 1),
        total: 1,
        percentage: counts.communication > 0 ? 100 : 0,
        items: [{ name: "Communication Activities", completed: counts.communication > 0 }],
      };
    case "execution":
      return {
        section: "execution",
        label: "Execution Planning",
        completed: Math.min(counts.timeline, 1) + Math.min(counts.risks, 1),
        total: 2,
        percentage: ((Math.min(counts.timeline, 1) + Math.min(counts.risks, 1)) / 2) * 100,
        items: [
          { name: "Timeline & Milestones", completed: counts.timeline > 0 },
          { name: "Risk Management", completed: counts.risks > 0 },
        ],
      };
    case "quality":
      return {
        section: "quality",
        label: "Quality Assurance",
        completed: 1,
        total: 1,
        percentage: 100,
        items: [{ name: "Quality Guidelines", completed: true }],
      };
    default:
      return {
        section: "unknown",
        label: "Unknown",
        completed: 0,
        total: 1,
        percentage: 0,
        items: [],
      };
  }
}

export function calculateOverallProgress(counts: CompletionCounts): number {
  const sections = ["strategic", "team", "communication", "execution", "quality"];
  const progressValues = sections.map((section) =>
    calculateSectionProgress(section, counts).percentage
  );
  return Math.round(progressValues.reduce((sum, val) => sum + val, 0) / sections.length);
}

export interface IncompleteSuggestion {
  section: string;
  sectionLabel: string;
  message: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export function generateSmartSuggestions(counts: CompletionCounts): IncompleteSuggestion[] {
  const suggestions: IncompleteSuggestion[] = [];

  // High priority: Core components
  if (counts.ingredients === 0) {
    suggestions.push({
      section: "strategic",
      sectionLabel: "Strategic Foundation",
      message: "Define active ingredients to identify core components of your initiative",
      action: "Add Active Ingredients",
      priority: "high",
    });
  }

  if (counts.strategies === 0) {
    suggestions.push({
      section: "strategic",
      sectionLabel: "Strategic Foundation",
      message: "Add implementation strategies to support your active ingredients",
      action: "Add Strategies",
      priority: "high",
    });
  }

  if (counts.team === 0) {
    suggestions.push({
      section: "team",
      sectionLabel: "Team & Capacity",
      message: "Build your implementation team with clear roles",
      action: "Add Team Members",
      priority: "high",
    });
  }

  // Medium priority: Support components
  if (counts.timeline === 0) {
    suggestions.push({
      section: "execution",
      sectionLabel: "Execution Planning",
      message: "Create milestones to track implementation progress",
      action: "Add Milestones",
      priority: "medium",
    });
  }

  if (counts.pd === 0) {
    suggestions.push({
      section: "team",
      sectionLabel: "Team & Capacity",
      message: "Plan professional development to build team capacity",
      action: "Add PD Activities",
      priority: "medium",
    });
  }

  if (counts.risks === 0) {
    suggestions.push({
      section: "execution",
      sectionLabel: "Execution Planning",
      message: "Identify potential risks and mitigation strategies",
      action: "Add Risks",
      priority: "medium",
    });
  }

  // Low priority: Optional components
  if (counts.communication === 0) {
    suggestions.push({
      section: "communication",
      sectionLabel: "Communication",
      message: "Develop communication plan for stakeholder engagement",
      action: "Add Communication Activities",
      priority: "low",
    });
  }

  if (counts.fidelity === 0) {
    suggestions.push({
      section: "quality",
      sectionLabel: "Quality Assurance",
      message: "Set up fidelity monitoring to ensure quality implementation",
      action: "Add Fidelity Checklists",
      priority: "low",
    });
  }

  return suggestions;
}
