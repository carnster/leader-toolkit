import { supabase } from "@/integrations/supabase/client";

export interface CreateNotificationParams {
  userId: string;
  initiativeId?: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      initiative_id: params.initiativeId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl || null,
    });

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create milestone completion notification
 */
export async function notifyMilestoneCompleted(
  userId: string,
  initiativeId: string,
  milestoneName: string
) {
  return createNotification({
    userId,
    initiativeId,
    type: "milestone_completed",
    title: "Milestone Completed",
    message: `Great work! "${milestoneName}" has been marked as complete.`,
    actionUrl: `/plan?initiative=${initiativeId}&section=execution`,
  });
}

/**
 * Create team member added notification
 */
export async function notifyTeamMemberAdded(
  userId: string,
  initiativeId: string,
  initiativeTitle: string,
  role: string
) {
  return createNotification({
    userId,
    initiativeId,
    type: "team_member_added",
    title: "Added to Initiative",
    message: `You've been added to "${initiativeTitle}" as ${role}.`,
    actionUrl: `/plan?initiative=${initiativeId}&section=team`,
  });
}

/**
 * Create observation completed notification
 */
export async function notifyObservationCompleted(
  userId: string,
  initiativeId: string,
  componentName: string,
  rating: number
) {
  return createNotification({
    userId,
    initiativeId,
    type: "observation_completed",
    title: "Observation Logged",
    message: `Observation for "${componentName}" completed with rating ${rating}/5.`,
    actionUrl: `/monitor?initiative=${initiativeId}`,
  });
}

/**
 * Create PDSA cycle completed notification
 */
export async function notifyPDSACycleCompleted(
  userId: string,
  initiativeId: string,
  cycleNumber: number
) {
  return createNotification({
    userId,
    initiativeId,
    type: "pdsa_completed",
    title: "PDSA Cycle Complete",
    message: `PDSA Cycle ${cycleNumber} has been completed. Time to plan the next iteration!`,
    actionUrl: `/implement?initiative=${initiativeId}`,
  });
}

/**
 * Trigger backend notification generation
 */
export async function triggerNotificationGeneration() {
  try {
    const { data, error } = await supabase.functions.invoke("generate-notifications");
    
    if (error) {
      console.error("Error triggering notification generation:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to trigger notification generation:", error);
    throw error;
  }
}
