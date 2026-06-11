// The ERIC framework: Expert Recommendations for Implementing Change
// (Powell et al., 2015, Implementation Science). 73 discrete implementation
// strategies organized into 9 clusters. Enum values match the database CHECK
// constraint and the recommend-strategies edge function tool schema.
// Labels are adapted for education contexts (e.g. "Support Educators" for the
// cluster published as "Support clinicians") while enum values stay canonical.

export type EricCategory =
  | "evaluative_iterative"
  | "provide_interactive_assistance"
  | "adapt_practice"
  | "develop_stakeholder_relationships"
  | "train_educate"
  | "support_clinicians"
  | "engage_consumers"
  | "use_financial_strategies"
  | "change_infrastructure";

export interface EricCluster {
  value: EricCategory;
  label: string;
  description: string;
  examples: string[];
}

export const ERIC_CLUSTERS: EricCluster[] = [
  {
    value: "evaluative_iterative",
    label: "Use Evaluative & Iterative Strategies",
    description: "Assess, audit, and refine implementation through ongoing cycles of data and feedback",
    examples: [
      "Audit and provide feedback",
      "Conduct cyclical small tests of change (PDSA)",
      "Develop and implement tools for quality monitoring",
      "Assess for readiness and identify barriers and facilitators",
      "Conduct local needs assessment",
      "Purposely reexamine the implementation",
    ],
  },
  {
    value: "provide_interactive_assistance",
    label: "Provide Interactive Assistance",
    description: "Offer hands-on coaching, facilitation, and support to implementers",
    examples: [
      "Provide ongoing coaching",
      "Facilitation by external or internal partners",
      "Provide local technical assistance",
      "Centralize technical assistance",
    ],
  },
  {
    value: "adapt_practice",
    label: "Adapt & Tailor to Context",
    description: "Customize the intervention's adaptable elements to fit local needs without compromising core ingredients",
    examples: [
      "Tailor strategies to local context",
      "Promote adaptability of peripheral elements",
      "Use data experts to guide adaptations",
      "Use data systems to track local variation",
    ],
  },
  {
    value: "develop_stakeholder_relationships",
    label: "Develop Stakeholder Relationships",
    description: "Build buy-in, partnerships, champions, and coalitions across the school community",
    examples: [
      "Identify and prepare champions",
      "Build a coalition",
      "Organize implementation team meetings",
      "Develop academic and community partnerships",
      "Recruit, designate, and train for leadership",
      "Conduct local consensus discussions",
      "Use advisory boards and workgroups",
    ],
  },
  {
    value: "train_educate",
    label: "Train & Educate",
    description: "Build knowledge and skill through professional development and educational materials",
    examples: [
      "Conduct ongoing training",
      "Develop and distribute educational materials",
      "Make training dynamic and job-embedded",
      "Conduct educational meetings and outreach visits",
      "Use train-the-trainer strategies",
      "Create a learning collaborative",
    ],
  },
  {
    value: "support_clinicians",
    label: "Support Educators",
    description: "Help teachers and staff succeed by reducing burden and creating supportive structures",
    examples: [
      "Revise professional roles to protect time",
      "Remind and prompt practitioners",
      "Create new teaching teams",
      "Develop resource-sharing agreements",
      "Relay implementation data back to educators",
    ],
  },
  {
    value: "engage_consumers",
    label: "Engage Students & Families",
    description: "Involve students, families, and the wider community in the change",
    examples: [
      "Involve students and family members in design and feedback",
      "Prepare students to be active participants",
      "Intervene with families to increase uptake at home",
      "Use mass communication to build awareness",
    ],
  },
  {
    value: "use_financial_strategies",
    label: "Use Financial Strategies",
    description: "Leverage funding, incentives, and resource allocation to enable implementation",
    examples: [
      "Access new or repurposed funding",
      "Alter incentive and recognition structures",
      "Fund and contract for the innovation",
      "Place the innovation on protected budget lines",
    ],
  },
  {
    value: "change_infrastructure",
    label: "Change Infrastructure",
    description: "Modify schedules, systems, policies, and physical structures to embed the practice",
    examples: [
      "Change schedules, calendars, and meeting structures",
      "Change record and data systems",
      "Revise policies and procedures to mandate or enable change",
      "Change the physical structure or equipment",
    ],
  },
];

export const ERIC_CLUSTER_MAP: Record<EricCategory, EricCluster> = Object.fromEntries(
  ERIC_CLUSTERS.map((c) => [c.value, c])
) as Record<EricCategory, EricCluster>;

/** Human-readable label for an eric_category value; falls back to the raw value for unknown/legacy data. */
export function ericLabel(value: string): string {
  return ERIC_CLUSTER_MAP[value as EricCategory]?.label ?? value;
}
