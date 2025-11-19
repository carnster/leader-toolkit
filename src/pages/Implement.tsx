import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlayCircle, Clock, CheckCircle2, MessageSquare, TrendingUp, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImplementationBehaviors } from "@/components/ImplementationBehaviors";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useSearchParams } from "react-router-dom";
import { TimelineTracker } from "@/components/TimelineTracker";

const mockFidelityLogs = [
  { id: "1", date: "2025-10-28", component: "Daily structured sessions", rating: 4, observer: "Sarah Chen" },
  { id: "2", date: "2025-10-27", component: "Core practice delivery", rating: 5, observer: "James Wilson" },
  { id: "3", date: "2025-10-27", component: "Weekly progress checks", rating: 3, observer: "Emma Davies" },
];

const mockNudges = [
  { id: "1", text: "Reminder: Weekly progress checks due Friday", type: "reminder", due: "2025-10-31" },
  { id: "2", text: "Tip: Try peer practice pairs during independent work time", type: "strategy", due: null },
];

export default function Implement() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  
  const { activeIngredients, isLoading: isLoadingIngredients } = useActiveIngredients(effectiveInitiativeId);
  const { strategies, isLoading: isLoadingStrategies } = useImplementationStrategies(effectiveInitiativeId);
  
  const coreIngredients = activeIngredients.filter((ing: any) => ing.is_core ?? ing.isCore);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <PlayCircle className="h-4 w-4" />
          <span>Stage 3: Implement</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Implement Stage</h1>
        <p className="text-muted-foreground mt-2">
          Put the plan into action while building supportive structures and cultivating a learning culture
        </p>
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              What to do in the Implement Stage
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Grow the implementers:</strong> Provide ongoing training, coaching, and support</li>
              <li>• <strong>Build supportive structures:</strong> Establish systems, policies, and resources needed for success</li>
              <li>• <strong>Use improvement cycles:</strong> Apply PDSA (Plan-Do-Study-Act) to continuously refine implementation</li>
              <li>• <strong>Gather implementation data:</strong> Monitor fidelity, adoption, and early outcomes</li>
              <li>• <strong>Harness data for action:</strong> Make data-informed adjustments to improve effectiveness</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Tracker */}
      <TimelineTracker initiativeId={effectiveInitiativeId} stage="implement" />
      
      {/* Active Ingredients from Plan Stage */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Core Active Ingredients (from Plan Stage)
          </CardTitle>
          <CardDescription>
            These components from your plan should be monitored during implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingIngredients ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : coreIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No core ingredients defined yet. Add them in the Plan stage.</p>
          ) : (
            <div className="space-y-2">
              {coreIngredients.map((ingredient: any) => (
                <div key={ingredient.id} className="flex items-start gap-2 text-sm rounded-lg border p-3 bg-background/50">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{ingredient.name}</p>
                    {ingredient.description && (
                      <p className="text-muted-foreground text-xs mt-1">{ingredient.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">60-Second Fidelity Log</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Quick check: Are core components happening as planned?
            </p>
            <Button className="w-full">Start Quick Log</Button>
          </CardContent>
        </Card>

        <Card className="border-secondary/50 bg-secondary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              <CardTitle className="text-lg">Coach Observation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed observation with feedback notes
            </p>
            <Button variant="secondary" className="w-full">New Observation</Button>
          </CardContent>
        </Card>

        <Card className="border-accent/50 bg-accent/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Team Check-In</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Log team reflections and adjustments
            </p>
            <Button variant="outline" className="w-full">Record Check-In</Button>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Nudges */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Implementation Nudges</CardTitle>
          </div>
          <CardDescription>
            Contextual prompts based on your active ingredients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockNudges.map((nudge) => (
            <div key={nudge.id} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{nudge.text}</p>
                {nudge.due && (
                  <p className="text-xs text-muted-foreground">Due: {new Date(nudge.due).toLocaleDateString()}</p>
                )}
              </div>
              <Button variant="ghost" size="sm">Dismiss</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Fidelity Logs</TabsTrigger>
          <TabsTrigger value="new-log">New Quick Log</TabsTrigger>
          <TabsTrigger value="behaviors">Behaviors</TabsTrigger>
        </TabsList>

        {/* Fidelity Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Fidelity Logs</CardTitle>
                  <CardDescription>
                    Track implementation quality over time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Avg: 4.0/5</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockFidelityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{log.component}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()} • Observed by {log.observer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={log.rating >= 4 ? "default" : log.rating >= 3 ? "secondary" : "destructive"}>
                        {log.rating}/5
                      </Badge>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Log Tab */}
        <TabsContent value="new-log" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>60-Second Fidelity Check</CardTitle>
              <CardDescription>
                Quick observation of core components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Component Being Observed</Label>
                  <select className="w-full rounded-md border px-3 py-2">
                    {coreIngredients.length > 0 ? (
                      coreIngredients.map((ingredient: any) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option>Daily structured sessions</option>
                        <option>Core practice delivery</option>
                        <option>Weekly progress checks</option>
                      </>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {coreIngredients.length > 0 
                      ? "Select from your core active ingredients defined in Plan stage"
                      : "Define active ingredients in Plan stage to track them here"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Fidelity Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/5 transition-colors font-semibold"
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    1 = Not implemented, 5 = Fully implemented as planned
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Quick Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any observations, barriers, or adjustments needed..."
                    rows={3}
                  />
                </div>
              </div>

              <Button className="w-full">Save Fidelity Log</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Behaviors Tab */}
        <TabsContent value="behaviors" className="space-y-6">
          <ImplementationBehaviors />
        </TabsContent>
      </Tabs>
    </div>
  );
}
