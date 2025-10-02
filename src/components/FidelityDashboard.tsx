import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface FidelityDashboardProps {
  initiativeId: string;
}

export function FidelityDashboard({ initiativeId }: FidelityDashboardProps) {
  const { fidelityLogs, isLoading } = useFidelityLogs(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);

  // Calculate average fidelity score
  const avgFidelity = fidelityLogs.length > 0
    ? fidelityLogs.reduce((sum, log) => sum + log.rating, 0) / fidelityLogs.length
    : 0;

  // Calculate fidelity by ingredient
  const fidelityByIngredient = activeIngredients
    .filter(ing => ing.is_core)
    .map((ingredient: ActiveIngredient) => {
      const logs = fidelityLogs.filter(log => log.component_id === ingredient.id);
      const avg = logs.length > 0
        ? logs.reduce((sum, log) => sum + log.rating, 0) / logs.length
        : 0;
      const recent = logs.slice(-5);
      const recentAvg = recent.length > 0
        ? recent.reduce((sum, log) => sum + log.rating, 0) / recent.length
        : avg;
      
      const trend = logs.length > 1 ? (recentAvg > avg ? "up" : recentAvg < avg ? "down" : "stable") : "stable";
      
      return {
        ingredient,
        avgScore: avg,
        recentAvg,
        trend,
        observationCount: logs.length,
      };
    });

  // Calculate trend for overall fidelity
  const recentLogs = fidelityLogs.slice(-10);
  const recentAvg = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + log.rating, 0) / recentLogs.length
    : avgFidelity;
  const overallTrend = fidelityLogs.length > 1 
    ? (recentAvg > avgFidelity ? "up" : recentAvg < avgFidelity ? "down" : "stable")
    : "stable";

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-success";
    if (score >= 3) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Overall Fidelity Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Fidelity Score
          </CardTitle>
          <CardDescription>
            Average across all observations ({fidelityLogs.length} total observations)
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
          
          {recentLogs.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Recent average (last 10 observations): <span className="font-semibold">{recentAvg.toFixed(1)}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
              <p className="text-sm text-muted-foreground">No fidelity data yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Complete observations to see fidelity scores
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fidelityByIngredient.map(({ ingredient, avgScore, trend, observationCount }) => (
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
                    <div className="flex items-center gap-3">
                      {getTrendIcon(trend)}
                      <span className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                        {avgScore > 0 ? avgScore.toFixed(1) : "—"}
                      </span>
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
                            "bg-destructive"
                          }`}
                          style={{ width: `${(avgScore / 5) * 100}%` }}
                        />
                      </div>
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
