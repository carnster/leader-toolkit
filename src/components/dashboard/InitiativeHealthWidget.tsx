import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { AlertTriangle, CheckCircle, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface InitiativeHealthWidgetProps {
  initiativeId?: string;
}

export function InitiativeHealthWidget({ initiativeId }: InitiativeHealthWidgetProps) {
  const { data: stats, isLoading } = useDashboardAnalytics(initiativeId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initiative Health</CardTitle>
          <CardDescription>Overall status across all initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading health data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalInitiatives === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initiative Health</CardTitle>
          <CardDescription>Overall status across all initiatives</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No initiatives to track</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthScore = Math.round(
    ((stats.onTrackInitiatives / stats.totalInitiatives) * 100)
  );

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-green-500" };
    if (score >= 60) return { label: "Good", color: "bg-blue-500" };
    if (score >= 40) return { label: "Fair", color: "bg-yellow-500" };
    return { label: "Needs Attention", color: "bg-red-500" };
  };

  const health = getHealthStatus(healthScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initiative Health</CardTitle>
        <CardDescription>
          Overall status across {stats.totalInitiatives} initiative{stats.totalInitiatives !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative h-32 w-32">
            <svg className="h-32 w-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(healthScore / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold">{healthScore}%</div>
                <div className="text-xs text-muted-foreground">{health.label}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats.onTrackInitiatives}</div>
              <div className="text-xs text-muted-foreground">On Track</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{stats.atRiskInitiatives}</div>
              <div className="text-xs text-muted-foreground">At Risk</div>
            </div>
          </div>
        </div>

        {stats.initiativeHealth.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            {stats.initiativeHealth.map((row) => (
              <Link
                key={row.id}
                to={`/plan?section=overview&initiative=${row.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {row.atRisk ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                ) : (
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                )}
                <span className="truncate">{row.title}</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  {row.atRisk ? "At risk" : "On track"}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Milestones Completed</span>
            <Badge variant="secondary">
              {stats.completedMilestones}/{stats.totalMilestones}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Upcoming Deadlines</span>
            <Badge variant={stats.upcomingDeadlines > 0 ? "destructive" : "secondary"}>
              {stats.upcomingDeadlines}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
