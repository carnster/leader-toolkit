import type { TeamMember } from "@/hooks/useTeamMembers";
import type { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import type { TimelineMilestone } from "@/hooks/useTimelineMilestones";
import type { ImplementationRisk } from "@/hooks/useImplementationRisks";
import type { PDActivity } from "@/hooks/usePDActivities";
import { supabase } from "@/integrations/supabase/client";

interface CalculatedTimeCommitment {
  role_name: string;
  hours_per_week: number;
  hours_per_month: number;
  description: string;
  breakdown: {
    strategies: number;
    milestones: number;
    risks: number;
    pdActivities: number;
    communicationActivities: number;
  };
}

// Time estimates per activity type (in hours per week)
const TIME_ESTIMATES = {
  strategyOwner: 2, // 2 hours per week per strategy
  milestoneOwner: 1.5, // 1.5 hours per week per milestone
  riskOwner: 0.5, // 30 minutes per week per risk
  pdFacilitator: 3, // 3 hours per week per PD activity (includes prep and delivery)
  communicationLead: 1, // 1 hour per week per communication activity
};

export async function calculateTimeCommitments(
  initiativeId: string,
  teamMembers: TeamMember[],
  strategies: ImplementationStrategy[],
  milestones: TimelineMilestone[],
  risks: ImplementationRisk[],
  pdActivities: PDActivity[]
): Promise<CalculatedTimeCommitment[]> {
  // Fetch communication activities
  const { data: communicationActivities } = await supabase
    .from("communication_activities")
    .select("assigned_to_id")
    .eq("initiative_id", initiativeId);

  // Create a map of team member assignments
  const timeCommitmentMap = new Map<string, CalculatedTimeCommitment>();

  // Initialize all team members with zero hours
  teamMembers.forEach((member) => {
    const roleName = member.name || member.role_in_initiative;
    timeCommitmentMap.set(member.id, {
      role_name: roleName,
      hours_per_week: 0,
      hours_per_month: 0,
      description: `Auto-calculated for ${roleName}`,
      breakdown: {
        strategies: 0,
        milestones: 0,
        risks: 0,
        pdActivities: 0,
        communicationActivities: 0,
      },
    });
  });

  // Calculate strategy owner time
  strategies.forEach((strategy) => {
    if (strategy.responsible_party_id && timeCommitmentMap.has(strategy.responsible_party_id)) {
      const commitment = timeCommitmentMap.get(strategy.responsible_party_id)!;
      commitment.hours_per_week += TIME_ESTIMATES.strategyOwner;
      commitment.breakdown.strategies += TIME_ESTIMATES.strategyOwner;
    }
  });

  // Calculate milestone owner time
  milestones.forEach((milestone) => {
    if (milestone.owner_id && timeCommitmentMap.has(milestone.owner_id)) {
      const commitment = timeCommitmentMap.get(milestone.owner_id)!;
      commitment.hours_per_week += TIME_ESTIMATES.milestoneOwner;
      commitment.breakdown.milestones += TIME_ESTIMATES.milestoneOwner;
    }
  });

  // Calculate risk owner time
  risks.forEach((risk) => {
    if (risk.owner_id && timeCommitmentMap.has(risk.owner_id)) {
      const commitment = timeCommitmentMap.get(risk.owner_id)!;
      commitment.hours_per_week += TIME_ESTIMATES.riskOwner;
      commitment.breakdown.risks += TIME_ESTIMATES.riskOwner;
    }
  });

  // Calculate PD facilitator time
  pdActivities.forEach((activity) => {
    if (activity.facilitator_id && timeCommitmentMap.has(activity.facilitator_id)) {
      const commitment = timeCommitmentMap.get(activity.facilitator_id)!;
      commitment.hours_per_week += TIME_ESTIMATES.pdFacilitator;
      commitment.breakdown.pdActivities += TIME_ESTIMATES.pdFacilitator;
    }
  });

  // Calculate communication lead time
  communicationActivities?.forEach((activity) => {
    if (activity.assigned_to_id && timeCommitmentMap.has(activity.assigned_to_id)) {
      const commitment = timeCommitmentMap.get(activity.assigned_to_id)!;
      commitment.hours_per_week += TIME_ESTIMATES.communicationLead;
      commitment.breakdown.communicationActivities += TIME_ESTIMATES.communicationLead;
    }
  });

  // Convert weekly hours to monthly hours and round
  const commitments = Array.from(timeCommitmentMap.values()).map((commitment) => ({
    ...commitment,
    hours_per_week: Math.round(commitment.hours_per_week * 10) / 10, // Round to 1 decimal
    hours_per_month: Math.round(commitment.hours_per_week * 4.33 * 10) / 10, // 4.33 weeks per month
    description: generateDescription(commitment),
  }));

  // Filter out team members with no assignments
  return commitments.filter((c) => c.hours_per_week > 0);
}

function generateDescription(commitment: CalculatedTimeCommitment): string {
  const parts: string[] = [];
  
  if (commitment.breakdown.strategies > 0) {
    parts.push(`${commitment.breakdown.strategies}h/wk for strategies`);
  }
  if (commitment.breakdown.milestones > 0) {
    parts.push(`${commitment.breakdown.milestones}h/wk for milestones`);
  }
  if (commitment.breakdown.risks > 0) {
    parts.push(`${commitment.breakdown.risks}h/wk for risks`);
  }
  if (commitment.breakdown.pdActivities > 0) {
    parts.push(`${commitment.breakdown.pdActivities}h/wk for PD`);
  }
  if (commitment.breakdown.communicationActivities > 0) {
    parts.push(`${commitment.breakdown.communicationActivities}h/wk for communication`);
  }

  return parts.length > 0
    ? `Auto-calculated: ${parts.join(", ")}`
    : `Auto-calculated for ${commitment.role_name}`;
}
