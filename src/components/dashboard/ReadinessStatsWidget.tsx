import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useReadinessStats } from "@/hooks/useReadinessStats";
import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";

export function ReadinessStatsWidget() {
  const { data: stats, isLoading } = useReadinessStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Implementation Readiness</CardTitle>
          <CardDescription>Completion status across initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading readiness stats...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Implementation Readiness</CardTitle>
          <CardDescription>Completion status across initiatives</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No active initiatives</p>
            <p className="text-sm">Create an initiative to track readiness</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallAverage = Math.round(
    stats.reduce((sum, stat) => sum + stat.completionPercentage, 0) / stats.length
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Implementation Readiness</CardTitle>
        <CardDescription>
          Average completion: {overallAverage}% across {stats.length} initiative{stats.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.slice(0, 5).map((stat) => (
          <Link 
            key={stat.initiativeId}
            to={`/plan?initiative=${stat.initiativeId}&section=team`}
            className="block hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {stat.completionPercentage === 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{stat.initiativeTitle}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {stat.completedItems}/{stat.totalItems}
              </span>
            </div>
            <Progress value={stat.completionPercentage} className="h-2" />
          </Link>
        ))}
        {stats.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{stats.length - 5} more initiatives
          </p>
        )}
      </CardContent>
    </Card>
  );
}
