import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Plus } from "lucide-react";
import { useState } from "react";
import { usePDSACycles } from "@/hooks/usePDSACycles";
import { useToast } from "@/hooks/use-toast";

interface PDSACycleAssistantProps {
  initiativeId: string;
}

export function PDSACycleAssistant({ initiativeId }: PDSACycleAssistantProps) {
  const { pdsaCycles, isLoading, createCycle } = usePDSACycles(initiativeId);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  
  const [newCycle, setNewCycle] = useState({
    aim: "",
    changeIdea: "",
    testWindowStart: "",
    testWindowEnd: ""
  });

  const handleCreate = async () => {
    if (!newCycle.aim || !newCycle.changeIdea) {
      toast({
        title: "Missing information",
        description: "Please provide an aim and change idea",
        variant: "destructive"
      });
      return;
    }

    const cycleNumber = (pdsaCycles?.length || 0) + 1;
    
    await createCycle({
      aim: newCycle.aim,
      change_idea: newCycle.changeIdea,
      cycle_number: cycleNumber,
      test_window_start: newCycle.testWindowStart || null,
      test_window_end: newCycle.testWindowEnd || null,
      status: "planning" as const
    });

    setNewCycle({ aim: "", changeIdea: "", testWindowStart: "", testWindowEnd: "" });
    setShowForm(false);
    
    toast({
      title: "PDSA cycle created",
      description: `Cycle ${cycleNumber} is ready to begin`
    });
  };

  return (
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
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Start New PDSA"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDSA Guide */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3 text-sm">
          <h4 className="font-semibold">PDSA Cycle Framework:</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <strong className="text-primary">Plan:</strong>
              <p className="text-muted-foreground">What are we trying to accomplish? What change can we test?</p>
            </div>
            <div>
              <strong className="text-secondary">Do:</strong>
              <p className="text-muted-foreground">Carry out the test. Collect data on what happens.</p>
            </div>
            <div>
              <strong className="text-accent">Study:</strong>
              <p className="text-muted-foreground">Analyze the data. What did we learn?</p>
            </div>
            <div>
              <strong className="text-success">Act:</strong>
              <p className="text-muted-foreground">Adopt, adapt, or abandon the change.</p>
            </div>
          </div>
        </div>

        {/* New Cycle Form */}
        {showForm && (
          <div className="rounded-lg border p-4 space-y-4 bg-background">
            <h4 className="font-semibold">New PDSA Cycle #{(pdsaCycles?.length || 0) + 1}</h4>
            
            <div className="space-y-2">
              <Label htmlFor="aim">Aim: What are you trying to accomplish?</Label>
              <Textarea
                id="aim"
                value={newCycle.aim}
                onChange={(e) => setNewCycle({ ...newCycle, aim: e.target.value })}
                placeholder="e.g., Increase daily session attendance from 75% to 90%"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="change">Change Idea: What change will you test?</Label>
              <Textarea
                id="change"
                value={newCycle.changeIdea}
                onChange={(e) => setNewCycle({ ...newCycle, changeIdea: e.target.value })}
                placeholder="e.g., Move sessions to start of day, before first break"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Test Start Date (optional)</Label>
                <Input
                  id="start"
                  type="date"
                  value={newCycle.testWindowStart}
                  onChange={(e) => setNewCycle({ ...newCycle, testWindowStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Test End Date (optional)</Label>
                <Input
                  id="end"
                  type="date"
                  value={newCycle.testWindowEnd}
                  onChange={(e) => setNewCycle({ ...newCycle, testWindowEnd: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleCreate} className="w-full">
              Create PDSA Cycle
            </Button>
          </div>
        )}

        {/* Existing Cycles */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading PDSA cycles...</p>
        ) : pdsaCycles && pdsaCycles.length > 0 ? (
          <div className="space-y-3">
            {pdsaCycles.map((cycle) => (
              <div key={cycle.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">PDSA Cycle {cycle.cycle_number}</h4>
                  <Badge variant={
                    cycle.status === "complete" ? "default" :
                    cycle.status === "testing" ? "secondary" :
                    "outline"
                  }>
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
                    <span>{cycle.change_idea}</span>
                  </div>
                  {cycle.results && (
                    <div>
                      <span className="font-medium text-muted-foreground">Results: </span>
                      <span>{cycle.results}</span>
                    </div>
                  )}
                  {cycle.decision && (
                    <div>
                      <span className="font-medium text-muted-foreground">Decision: </span>
                      <span className="font-semibold">{cycle.decision}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="mr-2 h-3 w-3" />
                    Update Status
                  </Button>
                  {cycle.status === "complete" && (
                    <Button variant="ghost" size="sm">
                      View Full Report
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !showForm && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No PDSA cycles yet. Start your first improvement cycle above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
