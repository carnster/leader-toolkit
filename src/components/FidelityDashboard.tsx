import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useFidelityLogs, type FidelityLog } from "@/hooks/useFidelityLogs";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import {
  isTwoDimensionResponse,
  summarizeTwoDimensionResponses,
  formatLevelCounts,
  levelColorClass,
  studentGroupOf,
  practiceScore,
  equityFromGroups,
  EQUITY_THRESHOLD_POINTS,
  type TwoDimensionResponse,
  type GroupSummary,
} from "@/lib/fidelityModel";

interface FidelityDashboardProps {
  initiativeId: string;
}

// Two-dimension logs write rating = NULL, since Delivery and Enactment are
// never averaged into one number. Every average on this page is a legacy
// (1-5) concept, so it's computed only over logs that actually carry one.
const hasRating = (log: FidelityLog): log is FidelityLog & { rating: number } =>
  typeof log.rating === "number";

// Pool every per-item { delivery, enactment } response across a set of
// two-dimension logs into one Delivery/Enactment/divergence summary.
function summarizeTwoDimensionLogs(logs: FidelityLog[]) {
  const pooled: Record<string, TwoDimensionResponse> = {};
  let key = 0;
  logs.forEach(log => {
    const responses = log.checklist_responses;
    if (!responses || typeof responses !== "object") return;
    // An observation the dialog marked "Not Rated" (>25% Not Observed) must not
    // feed its scored items into the pooled counts at all.
    if ((responses as Record<string, unknown>)._not_rated) return;
    Object.entries(responses as Record<string, unknown>).forEach(([itemId, value]) => {
      if (itemId === "_not_rated") return;
      if (isTwoDimensionResponse(value)) {
        pooled[`${log.id}:${itemId}:${key++}`] = value;
      }
    });
  });
  return summarizeTwoDimensionResponses(pooled);
}

// Pool two-dimension responses separately per student group, then compute the
// lowest observed group and the equity gap to the highest (PB 14: fidelity is
// read to the lowest group, with a 10-point equity threshold).
function equityAcrossGroups(logs: FidelityLog[]) {
  const byGroup: Record<string, Record<string, TwoDimensionResponse>> = {};
  let key = 0;
  logs.forEach(log => {
    const responses = log.checklist_responses;
    if (!responses || typeof responses !== "object") return;
    if ((responses as Record<string, unknown>)._not_rated) return;
    const group = studentGroupOf(responses);
    byGroup[group] = byGroup[group] || {};
    Object.entries(responses as Record<string, unknown>).forEach(([itemId, value]) => {
      if (itemId.startsWith("_")) return;
      if (isTwoDimensionResponse(value)) {
        byGroup[group][`${log.id}:${itemId}:${key++}`] = value;
      }
    });
  });
  const groups: GroupSummary[] = Object.entries(byGroup).map(([group, responses]) => {
    const counts = summarizeTwoDimensionResponses(responses).practice;
    return { group, counts, score: practiceScore(counts) };
  });
  return equityFromGroups(groups);
}

export function FidelityDashboard({ initiativeId }: FidelityDashboardProps) {
  const { fidelityLogs, isLoading } = useFidelityLogs(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);

  const ratedLogs = fidelityLogs.filter(hasRating);
  const twoDimLogs: FidelityLog[] = fidelityLogs.filter(log => typeof log.rating !== "number");

  // Calculate average fidelity score (legacy 1-5 logs only)
  const avgFidelity = ratedLogs.length > 0
    ? ratedLogs.reduce((sum, log) => sum + log.rating, 0) / ratedLogs.length
    : 0;

  const twoDimSummary = summarizeTwoDimensionLogs(twoDimLogs);
  const hasTwoDimData = twoDimLogs.length > 0;
  const equity = hasTwoDimData ? equityAcrossGroups(twoDimLogs) : null;

  // Calculate fidelity by ingredient
  const fidelityByIngredient = activeIngredients
    .filter(ing => ing.is_core)
    .map((ingredient: ActiveIngredient) => {
      const logs = ratedLogs.filter(log => log.component_id === ingredient.id);
      const avg = logs.length > 0
        ? logs.reduce((sum, log) => sum + log.rating, 0) / logs.length
        : 0;
      const recent = logs.slice(-5);
      const recentAvg = recent.length > 0
        ? recent.reduce((sum, log) => sum + log.rating, 0) / recent.length
        : avg;

      const trend = logs.length > 1 ? (recentAvg > avg ? "up" : recentAvg < avg ? "down" : "stable") : "stable";

      const ingredientTwoDimLogs = twoDimLogs.filter(log => log.component_id === ingredient.id);

      return {
        ingredient,
        avgScore: avg,
        recentAvg,
        trend,
        observationCount: logs.length + ingredientTwoDimLogs.length,
        twoDimSummary: ingredientTwoDimLogs.length > 0 ? summarizeTwoDimensionLogs(ingredientTwoDimLogs) : null,
      };
    });

  // Calculate trend for overall fidelity (legacy 1-5 logs only)
  const recentLogs = ratedLogs.slice(-10);
  const recentAvg = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + log.rating, 0) / recentLogs.length
    : avgFidelity;
  const overallTrend = ratedLogs.length > 1
    ? (recentAvg > avgFidelity ? "up" : recentAvg < avgFidelity ? "down" : "stable")
    : "stable";

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-success";
    if (score >= 3) return "text-warning";
    return "text-orange-700 dark:text-orange-400";
  };

  const scoreDescriptor = (s: number) =>
    s >= 4 ? "Strong" : s >= 3 ? "Developing" : "Focus area: pair with coaching";

  return (
    <div className="space-y-6">
      {/* Overall Fidelity Score: legacy 1-5 checklists only. Two-dimension logs
          carry rating = null and are never averaged, so this card is hidden
          entirely when there are no rated logs (otherwise it showed a false
          0.0 / 5.0 "focus area" for initiatives that only use two-dimension). */}
      {ratedLogs.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Fidelity Score
          </CardTitle>
          <CardDescription>
            Average across the {ratedLogs.length} rated observation{ratedLogs.length === 1 ? "" : "s"} (two-dimension checklists are summarized separately below)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-bold ${getScoreColor(avgFidelity)}`}>
                {avgFidelity.toFixed(1)}
              </span>
              <span className="text-2xl text-muted-foreground">/ 5.0</span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(overallTrend)}
              <span className="text-sm text-muted-foreground capitalize">{overallTrend}</span>
            </div>
          </div>
          {fidelityLogs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{scoreDescriptor(avgFidelity)}</p>
          )}

          {recentLogs.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Recent average (last 10 observations): <span className="font-semibold">{recentAvg.toFixed(1)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Two-Dimension Fidelity Summary (PB 14: Delivery + Enactment) */}
      {hasTwoDimData && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery and Enactment</CardTitle>
            <CardDescription>
              Two-dimension checklists rate each look-for on Delivery and Enactment separately.
              These are never averaged into a single score ({twoDimLogs.length} two-dimension observation{twoDimLogs.length === 1 ? "" : "s"}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">Delivery:</span>
              <Badge variant="outline">{formatLevelCounts(twoDimSummary.delivery)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">Enactment:</span>
              <Badge variant="outline">{formatLevelCounts(twoDimSummary.enactment)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">Practice rating (lower of the two):</span>
              <Badge variant="outline">{formatLevelCounts(twoDimSummary.practice)}</Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm pt-2 border-t">
              <span className="font-medium">Divergence flags:</span>
              <Badge variant="outline" className={twoDimSummary.divergentCount > 0 ? levelColorClass("M") : undefined}>
                {twoDimSummary.divergentCount}
                {twoDimSummary.deliveredNotWorkingCount > 0 && ` (${twoDimSummary.deliveredNotWorkingCount} Delivered, Not Working)`}
              </Badge>
            </div>

            {/* Equity: fidelity read to the lowest observed student group */}
            {equity && equity.lowestGroup && (
              <div className="pt-2 border-t space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">Lowest observed group:</span>
                  <Badge variant="outline">
                    {equity.lowestGroup}
                    {equity.lowestScore !== null && ` (${Math.round(equity.lowestScore)}/100)`}
                  </Badge>
                </div>
                {equity.ratedGroups >= 2 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">Equity gap:</span>
                    <Badge variant="outline" className={equity.flag ? levelColorClass("M") : levelColorClass("F")}>
                      {Math.round(equity.gap)} points
                      {equity.flag
                        ? ` (over the ${EQUITY_THRESHOLD_POINTS}-point threshold)`
                        : ` (within ${EQUITY_THRESHOLD_POINTS})`}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fidelity by Active Ingredient */}
      <Card>
        <CardHeader>
          <CardTitle>Fidelity by Core Ingredient</CardTitle>
          <CardDescription>
            Implementation quality for each core component
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading fidelity data...</p>
          ) : fidelityByIngredient.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No observations logged yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Log your first observation to start seeing trends here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fidelityByIngredient.map(({ ingredient, avgScore, trend, observationCount, twoDimSummary: ingredientTwoDim }) => (
                <div key={ingredient.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{ingredient.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {observationCount} observations
                        </Badge>
                      </div>
                      {ingredient.description && (
                        <p className="text-xs text-muted-foreground">{ingredient.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend)}
                        <span className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                          {avgScore > 0 ? avgScore.toFixed(1) : "—"}
                        </span>
                      </div>
                      {avgScore > 0 && (
                        <span className="text-xs text-muted-foreground">{scoreDescriptor(avgScore)}</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {avgScore > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Fidelity Level</span>
                        <span>{((avgScore / 5) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            avgScore >= 4 ? "bg-success" : 
                            avgScore >= 3 ? "bg-warning" : 
                            "bg-orange-600"
                          }`}
                          style={{ width: `${(avgScore / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Two-dimension summary for this ingredient, side by side, never averaged */}
                  {ingredientTwoDim && (
                    <div className="space-y-1 pt-2 border-t text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground">Delivery:</span>
                        <Badge variant="outline">{formatLevelCounts(ingredientTwoDim.delivery)}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground">Enactment:</span>
                        <Badge variant="outline">{formatLevelCounts(ingredientTwoDim.enactment)}</Badge>
                      </div>
                      {ingredientTwoDim.divergentCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-muted-foreground">Divergence:</span>
                          <Badge variant="outline" className={levelColorClass("M")}>
                            {ingredientTwoDim.divergentCount}
                            {ingredientTwoDim.deliveredNotWorkingCount > 0 && ` (${ingredientTwoDim.deliveredNotWorkingCount} Delivered, Not Working)`}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
