import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mockIndicators = [
  { id: "1", name: "Fidelity (avg)", value: 4.0, target: 4.5, type: "leading", trend: "up" },
  { id: "2", name: "Adoption (%)", value: 85, target: 90, type: "leading", trend: "up" },
  { id: "3", name: "Staff Acceptability", value: 3.8, target: 4.0, type: "leading", trend: "stable" },
  { id: "4", name: "Reading Growth (SSA)", value: 62, target: 75, type: "lagging", trend: "up" },
];

const mockPDSA = [
  { 
    id: "1",
    cycle: "PDSA 1",
    aim: "Increase daily phonics session attendance from 75% to 90%",
    changeIdea: "Move sessions to start of day, before first break",
    status: "complete",
    outcome: "Attendance increased to 88% - close to target"
  },
  {
    id: "2",
    cycle: "PDSA 2",
    aim: "Improve fidelity of progress checks from 3.2 to 4.0",
    changeIdea: "Provide simplified tracking template and weekly coaching",
    status: "testing",
    outcome: "Testing in progress - early data shows improvement"
  },
];

export default function Monitor() {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <BarChart3 className="h-4 w-4" />
          <span>Stage 4: Monitor</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Monitor & Adjust</h1>
        <p className="text-muted-foreground">
          Track leading and lagging indicators, run PDSA cycles, and make data-informed adjustments
        </p>
      </div>

      {/* Key Indicators */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockIndicators.map((indicator) => (
          <Card key={indicator.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{indicator.name}</CardTitle>
                <Badge variant={indicator.type === "leading" ? "default" : "secondary"}>
                  {indicator.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {indicator.value}
                      {indicator.name.includes("%") ? "%" : ""}
                    </span>
                    {indicator.trend === "up" && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {indicator.trend === "down" && (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Target</p>
                    <p className="font-semibold">
                      {indicator.target}
                      {indicator.name.includes("%") ? "%" : ""}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress to target</span>
                    <span className="font-medium">
                      {Math.round((indicator.value / indicator.target) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(indicator.value / indicator.target) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Implementation Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Implementation Dashboard</CardTitle>
              <CardDescription>
                Fidelity, adoption, and acceptability over time
              </CardDescription>
            </div>
            <Button variant="outline">View Full Report</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart visualization would appear here</p>
              <p className="text-xs">Showing trends over last 8 weeks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDSA Cycles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>PDSA Cycles</CardTitle>
                <CardDescription>
                  Plan-Do-Study-Act: Continuous improvement loops
                </CardDescription>
              </div>
            </div>
            <Button>Start New PDSA</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockPDSA.map((cycle) => (
            <div key={cycle.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{cycle.cycle}</h4>
                <Badge variant={cycle.status === "complete" ? "default" : "secondary"}>
                  {cycle.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Aim: </span>
                  <span>{cycle.aim}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Change Idea: </span>
                  <span>{cycle.changeIdea}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Outcome: </span>
                  <span>{cycle.outcome}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">View Details</Button>
                {cycle.status === "complete" && (
                  <Button variant="ghost" size="sm">Scale or Abandon</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Update Indicators</CardTitle>
          <CardDescription>
            Log new data points for leading and lagging measures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Enter Fidelity Data</span>
              <span className="text-sm text-muted-foreground">
                Weekly aggregate or per-component
              </span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Import Assessment Data</span>
              <span className="text-sm text-muted-foreground">
                Upload CSV from SIS or LMS
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
