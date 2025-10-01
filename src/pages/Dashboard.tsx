import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StageProgress } from "@/components/StageProgress";
import { Plus, AlertCircle, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const mockStages = [
  { id: "decide", name: "Decide", completed: true, current: false },
  { id: "plan", name: "Plan", completed: true, current: false },
  { id: "implement", name: "Implement", completed: false, current: true },
  { id: "monitor", name: "Monitor", completed: false, current: false },
  { id: "sustain", name: "Sustain", completed: false, current: false },
];

const mockInitiatives = [
  {
    id: "1",
    title: "Reading Fluency Programme",
    stage: "Implement",
    progress: 65,
    dueDate: "2025-11-15",
    status: "on-track",
    team: 8,
  },
  {
    id: "2",
    title: "Math Mastery Approach",
    stage: "Plan",
    progress: 30,
    dueDate: "2025-12-01",
    status: "at-risk",
    team: 12,
  },
  {
    id: "3",
    title: "Behaviour for Learning",
    stage: "Monitor",
    progress: 85,
    dueDate: "2025-10-30",
    status: "on-track",
    team: 15,
  },
];

const mockAlerts = [
  {
    id: "1",
    type: "warning",
    message: "Reading Fluency: Fidelity check due tomorrow",
    initiative: "Reading Fluency Programme",
  },
  {
    id: "2",
    type: "info",
    message: "Math Mastery: Team meeting scheduled for Thursday",
    initiative: "Math Mastery Approach",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementation Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your school improvement initiatives
          </p>
        </div>
        <Button asChild>
          <Link to="/decide">
            <Plus className="mr-2 h-4 w-4" />
            New Initiative
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Initiatives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 on track, 1 needs attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fidelity</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">
              Across all initiatives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {mockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    alert.type === "warning"
                      ? "text-warning"
                      : "text-primary"
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.initiative}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle>Active Initiatives</CardTitle>
          <CardDescription>
            Monitor progress across all implementation stages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mockInitiatives.map((initiative) => (
            <div key={initiative.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">{initiative.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Stage: {initiative.stage}</span>
                    <span>•</span>
                    <span>Due: {new Date(initiative.dueDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{initiative.team} team members</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/initiatives/${initiative.id}`}>View Details</Link>
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{initiative.progress}%</span>
                </div>
                <Progress value={initiative.progress} className="h-2" />
              </div>
              <div className="pt-2">
                <StageProgress stages={mockStages} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link to="/implement">
                <span className="font-semibold">Log Fidelity Check</span>
                <span className="text-sm text-muted-foreground">
                  Quick 60-second observation
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link to="/monitor">
                <span className="font-semibold">Review Data</span>
                <span className="text-sm text-muted-foreground">
                  Check leading indicators
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link to="/decide">
                <span className="font-semibold">Start New Initiative</span>
                <span className="text-sm text-muted-foreground">
                  Begin with Decision Brief
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
