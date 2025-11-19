import { supabase } from "@/integrations/supabase/client";

/**
 * Parses indicator text to extract name and frequency
 * Format: "Indicator name (Frequency)" or just "Indicator name"
 */
export function parseIndicator(text: string): { name: string; schedule: string | null } {
  const match = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  
  if (match) {
    return {
      name: match[1].trim(),
      schedule: match[2].trim()
    };
  }
  
  return {
    name: text.trim(),
    schedule: null
  };
}

/**
 * Migrates indicators from decision brief to structured indicators table
 */
export async function migrateIndicatorsFromDecisionBrief(
  initiativeId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Fetch decision brief
    const { data: decisionBrief, error: fetchError } = await supabase
      .from("decision_briefs")
      .select("leading_indicators, lagging_indicators, measurement_timeline")
      .eq("initiative_id", initiativeId)
      .single();

    if (fetchError) throw fetchError;
    if (!decisionBrief) {
      return { success: false, count: 0, error: "No decision brief found" };
    }

    // Check if indicators already exist
    const { data: existingIndicators } = await supabase
      .from("indicators")
      .select("id")
      .eq("initiative_id", initiativeId)
      .limit(1);

    if (existingIndicators && existingIndicators.length > 0) {
      return { success: true, count: 0, error: "Indicators already migrated" };
    }

    const indicatorsToInsert: Array<{
      initiative_id: string;
      type: "leading" | "lagging";
      name: string;
      schedule: string | null;
      source: string | null;
    }> = [];

    // Process leading indicators
    if (decisionBrief.leading_indicators) {
      decisionBrief.leading_indicators.forEach((text: string) => {
        const { name, schedule } = parseIndicator(text);
        indicatorsToInsert.push({
          initiative_id: initiativeId,
          type: "leading",
          name,
          schedule,
          source: "Decision Brief"
        });
      });
    }

    // Process lagging indicators
    if (decisionBrief.lagging_indicators) {
      decisionBrief.lagging_indicators.forEach((text: string) => {
        const { name, schedule } = parseIndicator(text);
        indicatorsToInsert.push({
          initiative_id: initiativeId,
          type: "lagging",
          name,
          schedule,
          source: "Decision Brief"
        });
      });
    }

    // Note: measurement_timeline (data collection activities) are stored as indicators 
    // with a special source to distinguish them, but they're not traditional indicators
    // We'll keep them in the decision brief for reference in the measurement plan

    if (indicatorsToInsert.length === 0) {
      return { success: true, count: 0 };
    }

    // Insert indicators
    const { error: insertError } = await supabase
      .from("indicators")
      .insert(indicatorsToInsert);

    if (insertError) throw insertError;

    return { success: true, count: indicatorsToInsert.length };
  } catch (error) {
    console.error("Error migrating indicators:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Checks if indicators need to be imported from decision brief
 */
export async function checkIndicatorsNeedImport(
  initiativeId: string
): Promise<boolean> {
  try {
    // Check if indicators exist
    const { data: indicators } = await supabase
      .from("indicators")
      .select("id")
      .eq("initiative_id", initiativeId)
      .limit(1);

    if (indicators && indicators.length > 0) {
      return false; // Already have indicators
    }

    // Check if decision brief has indicators
    const { data: decisionBrief } = await supabase
      .from("decision_briefs")
      .select("leading_indicators, lagging_indicators")
      .eq("initiative_id", initiativeId)
      .single();

    if (!decisionBrief) return false;

    const hasIndicators = 
      (decisionBrief.leading_indicators && decisionBrief.leading_indicators.length > 0) ||
      (decisionBrief.lagging_indicators && decisionBrief.lagging_indicators.length > 0);

    return hasIndicators;
  } catch (error) {
    console.error("Error checking indicators:", error);
    return false;
  }
}
