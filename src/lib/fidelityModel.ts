// PB 14 two-dimension fidelity model: Delivery and Enactment.
//
// A checklist opts into this model via rating_scale.model === "two_dimension".
// A checklist without that field is legacy 1-5 and is untouched by anything
// in this file. Delivery and Enactment are never averaged, not within a
// dimension and not across; they are always reported side by side. The
// PRACTICE rating of a look-for is the lower of the two (NO excluded).

export type FidelityLevel = "F" | "P" | "M" | "N";
export type FidelityCode = FidelityLevel | "NO";

// High to low. "NO" (Not Observed) is deliberately excluded: it describes the
// evidence window, not the practice, and is never part of the lower-of-two.
export const LEVELS: FidelityLevel[] = ["F", "P", "M", "N"];

export const LEVEL_LABELS: Record<FidelityCode, string> = {
  F: "Full",
  P: "Partial",
  M: "Minimal",
  N: "None",
  NO: "Not Observed",
};

export interface TwoDimensionRatingScale {
  model: "two_dimension";
  dimensions: [string, string];
  levels: { code: FidelityCode; label: string }[];
  rule: "lower_of_two";
}

export interface LegacyRatingScale {
  min: number;
  max: number;
  labels: string[];
  model?: undefined;
}

export type RatingScale = TwoDimensionRatingScale | LegacyRatingScale;

export interface TwoDimensionResponse {
  delivery: FidelityCode;
  enactment: FidelityCode;
}

/** True when a checklist's rating_scale opts into the two-dimension model. */
export function isTwoDimension(ratingScale: any): ratingScale is TwoDimensionRatingScale {
  return !!ratingScale && ratingScale.model === "two_dimension";
}

/** True when a per-item response is already in { delivery, enactment } shape. */
export function isTwoDimensionResponse(response: any): response is TwoDimensionResponse {
  return !!response && typeof response === "object" && !Array.isArray(response)
    && ("delivery" in response || "enactment" in response);
}

function levelIndex(code: FidelityCode | null | undefined): number {
  if (!code || code === "NO") return -1;
  return LEVELS.indexOf(code as FidelityLevel);
}

/**
 * The practice rating for a look-for is the lower of Delivery and Enactment
 * (F > P > M > N). NO is excluded from the comparison. Returns null when both
 * sides are NO (nothing to rate) or unset.
 */
export function practiceRating(
  delivery: FidelityCode | null | undefined,
  enactment: FidelityCode | null | undefined
): FidelityLevel | null {
  const dIdx = levelIndex(delivery);
  const eIdx = levelIndex(enactment);
  if (dIdx === -1 && eIdx === -1) return null;
  if (dIdx === -1) return enactment as FidelityLevel;
  if (eIdx === -1) return delivery as FidelityLevel;
  // Higher index = lower fidelity level in the LEVELS array.
  return dIdx >= eIdx ? (delivery as FidelityLevel) : (enactment as FidelityLevel);
}

/** True when Delivery and Enactment are both real (not NO) and differ. */
export function isDivergent(
  delivery: FidelityCode | null | undefined,
  enactment: FidelityCode | null | undefined
): boolean {
  if (!delivery || !enactment) return false;
  if (delivery === "NO" || enactment === "NO") return false;
  return delivery !== enactment;
}

/**
 * The signature divergence case the network calls out by name: the practice
 * is being delivered (Full or Partial) but isn't landing (Minimal or None).
 */
export function deliveredNotWorking(
  delivery: FidelityCode | null | undefined,
  enactment: FidelityCode | null | undefined
): boolean {
  const deliveredWell = delivery === "F" || delivery === "P";
  const notWorking = enactment === "M" || enactment === "N";
  return deliveredWell && notWorking;
}

export function levelLabel(code: FidelityCode | null | undefined): string {
  if (!code) return "—";
  return LEVEL_LABELS[code] ?? code;
}

/**
 * Chip color per level. Amber carries divergence and Minimal; None is the
 * only level that reads as destructive red. Full and Partial read as
 * success/neutral. Values are Tailwind utility classes matching existing
 * shadcn badge idioms elsewhere in the app.
 */
export function levelColorClass(code: FidelityCode | null | undefined): string {
  switch (code) {
    case "F":
      return "text-success border-success/40 bg-success/10";
    case "P":
      return "text-primary border-primary/40 bg-primary/10";
    case "M":
      return "text-warning border-warning/40 bg-warning/10";
    case "N":
      return "text-destructive border-destructive/40 bg-destructive/10";
    case "NO":
      return "text-muted-foreground border-muted-foreground/30 bg-muted";
    default:
      return "text-muted-foreground border-muted-foreground/30 bg-muted";
  }
}

/** Fraction of a checklist's items rated "NO" (Not Observed), 0-1. */
export function notObservedFraction(responses: Record<string, TwoDimensionResponse>): number {
  const entries = Object.values(responses);
  if (entries.length === 0) return 0;
  const notObservedCount = entries.filter(
    (r) => r.delivery === "NO" && r.enactment === "NO"
  ).length;
  return notObservedCount / entries.length;
}

/** Whether NO exceeds 25% of items, which marks the observation "Not Rated". */
export function isNotRated(responses: Record<string, TwoDimensionResponse>): boolean {
  return notObservedFraction(responses) > 0.25;
}

export interface LevelCounts {
  F: number;
  P: number;
  M: number;
  N: number;
  NO: number;
}

export function emptyLevelCounts(): LevelCounts {
  return { F: 0, P: 0, M: 0, N: 0, NO: 0 };
}

/** Format level counts compactly, e.g. "3F 1P 1M". Zero counts are omitted. */
export function formatLevelCounts(counts: LevelCounts): string {
  const parts: string[] = [];
  for (const level of [...LEVELS, "NO"] as FidelityCode[]) {
    const count = counts[level];
    if (count > 0) parts.push(`${count}${level}`);
  }
  return parts.length > 0 ? parts.join(" ") : "—";
}

/**
 * Summarize a two-dimension checklist_responses object: per-dimension level
 * counts, practice-level (lower-of-two) counts, divergence count, and the
 * count of "Delivered, Not Working" items specifically.
 */
export function summarizeTwoDimensionResponses(responses: Record<string, TwoDimensionResponse>) {
  const delivery = emptyLevelCounts();
  const enactment = emptyLevelCounts();
  const practice = emptyLevelCounts();
  let divergentCount = 0;
  let deliveredNotWorkingCount = 0;

  Object.values(responses).forEach((r) => {
    if (r.delivery in delivery) delivery[r.delivery as keyof LevelCounts]++;
    if (r.enactment in enactment) enactment[r.enactment as keyof LevelCounts]++;

    const practiceLevel = practiceRating(r.delivery, r.enactment);
    if (practiceLevel) practice[practiceLevel]++;

    if (isDivergent(r.delivery, r.enactment)) divergentCount++;
    if (deliveredNotWorking(r.delivery, r.enactment)) deliveredNotWorkingCount++;
  });

  return { delivery, enactment, practice, divergentCount, deliveredNotWorkingCount };
}
