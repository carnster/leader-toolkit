import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Calendar, Users, BookOpen, Scale } from "lucide-react";
import { MasterChecklist } from "@/components/MasterChecklist";
import { useSearchParams } from "react-router-dom";

const sustainChecklist = [
  { id: "1", text: "Leaders continue to acknowledge and support good implementation practices", completed: true },
  { id: "2", text: "Range of staff involved so we aren't over-relying on individuals", completed: true },
  { id: "3", text: "Reviewed implementation effort and outcomes before deciding next steps", completed: false },
  { id: "4", text: "Core practices embedded in standard operating procedures", completed: false },
];

const mockRoutines = [
  { id: "1", routine: "Weekly planning meetings", frequency: "Every Monday 3:30pm", owner: "Year 3 Lead" },
  { id: "2", routine: "Monthly data reviews", frequency: "Last Friday of month", owner: "Implementation Lead" },
  { id: "3", routine: "Termly fidelity checks", frequency: "End of each term", owner: "Senior Leadership" },
];

const mockOnboarding = [
  { id: "1", resource: "New Teacher Induction Pack", status: "complete" },
  { id: "2", resource: "Core Practices Video Series", status: "complete" },
  { id: "3", resource: "Mentor Assignment Process", status: "in-progress" },
];

export default function Sustain() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Shield className="h-4 w-4" />
          <span>Stage 4: Spread and Sustain</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Spread and Sustain Stage</h1>
        <p className="text-muted-foreground mt-2">
          Navigate to sustainment, embed practices into standard operations, and prepare for spread
        </p>
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              What to do in the Spread and Sustain Stage
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Navigate to sustainment:</strong> Transition from learning the work to doing the work</li>
              <li>• <strong>Embed in routines:</strong> Make practices part of standard operating procedures</li>
              <li>• <strong>Protect resources:</strong> Secure time, budget, and staffing allocations</li>
              <li>• <strong>Build onboarding systems:</strong> Prepare materials for new staff joining the initiative</li>
              <li>• <strong>Assess scale readiness:</strong> Determine if you're ready to expand to other settings</li>
              <li>• <strong>Celebrate success:</strong> Recognize and reward implementation achievements</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Sustainability Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Checklist</CardTitle>
          <CardDescription>
            Ensure the initiative is embedded for the long term
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sustainChecklist.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 rounded-lg border p-3">
              <Checkbox
                id={item.id}
                checked={item.completed}
                className="mt-0.5"
              />
              <label
                htmlFor={item.id}
                className="flex-1 text-sm leading-relaxed cursor-pointer"
              >
                {item.text}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Embedding Routines */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Embedding Routines</CardTitle>
              <CardDescription>
                Regular practices that maintain implementation quality
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRoutines.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">{item.routine}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{item.frequency}</span>
                    <span>•</span>
                    <span>Owner: {item.owner}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            Add Routine
          </Button>
        </CardContent>
      </Card>

      {/* Onboarding Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Onboarding Resources</CardTitle>
              <CardDescription>
                Help new staff understand and implement core practices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockOnboarding.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.resource}</span>
                </div>
                <Badge variant={item.status === "complete" ? "default" : "secondary"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            Add Resource
          </Button>
        </CardContent>
      </Card>

      {/* Resource Protections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Resource Protections</CardTitle>
              <CardDescription>
                Safeguards to maintain time, budget, and staffing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">Time Allocations</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Daily structured session time protected in timetable</li>
              <li>• Weekly team meeting time (1 hour) ring-fenced</li>
              <li>• Monthly data review time allocated</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">Budget & Materials</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Annual budget line for core materials</li>
              <li>• Replacement materials fund</li>
              <li>• Professional learning budget protected</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">Staffing & Expertise</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Implementation Lead role formalized (0.2 FTE)</li>
              <li>• Training included in new teacher induction</li>
              <li>• Coaching capacity maintained (2 hours/week)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scale Readiness */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Scale Readiness Scan</CardTitle>
                <CardDescription>
                  Assess if you're ready to expand to other year groups or schools
                </CardDescription>
              </div>
            </div>
            <Button>Run Scan</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Evidence of Impact</p>
                <p className="text-sm text-muted-foreground">Do you have clear outcome data?</p>
              </div>
              <Badge>Strong</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Fidelity & Sustainability</p>
                <p className="text-sm text-muted-foreground">Are practices embedded?</p>
              </div>
              <Badge variant="secondary">Moderate</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Leadership & Resources</p>
                <p className="text-sm text-muted-foreground">Can you support expansion?</p>
              </div>
              <Badge variant="secondary">Moderate</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decision Point */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Decision Point: Next Steps</CardTitle>
          <CardDescription>
            Based on your implementation review and outcomes, what's next?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Continue & Refine</span>
              <span className="text-sm text-muted-foreground">
                Keep going with minor adjustments
              </span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Scale Up</span>
              <span className="text-sm text-muted-foreground">
                Expand to more year groups/schools
              </span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Stop or Pivot</span>
              <span className="text-sm text-muted-foreground">
                Data suggests a different approach
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Checklist */}
      <MasterChecklist stage="sustain" initiativeId={effectiveInitiativeId} />
    </div>
  );
}
