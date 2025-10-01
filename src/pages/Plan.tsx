import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Calendar, Shield, Lightbulb, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockActiveIngredients = [
  { id: "1", name: "Daily 20-min phonics sessions", category: "Instruction", isCore: true },
  { id: "2", name: "Decodable texts matched to skill", category: "Resources", isCore: true },
  { id: "3", name: "Weekly progress checks", category: "Assessment", isCore: true },
  { id: "4", name: "Peer practice pairs", category: "Environment", isCore: false },
  { id: "5", name: "Home reading logs", category: "Engagement", isCore: false },
];

const mockTeam = [
  { id: "1", name: "Sarah Chen", role: "Implementation Lead", avatar: "SC" },
  { id: "2", name: "James Wilson", role: "Year 3 Lead", avatar: "JW" },
  { id: "3", name: "Emma Davies", role: "SEN Coordinator", avatar: "ED" },
  { id: "4", name: "Michael Brown", role: "Teaching Assistant", avatar: "MB" },
];

const mockTimeline = [
  { id: "1", phase: "Preparation", date: "Oct 2025", tasks: 3, status: "complete" },
  { id: "2", phase: "Launch", date: "Nov 2025", tasks: 5, status: "in-progress" },
  { id: "3", phase: "Early Review", date: "Dec 2025", tasks: 2, status: "upcoming" },
  { id: "4", phase: "Refinement", date: "Jan 2026", tasks: 4, status: "upcoming" },
];

export default function Plan() {
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <FileText className="h-4 w-4" />
          <span>Stage 2: Plan / EEF Prepare</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Implementation Planning</h1>
        <p className="text-muted-foreground">
          Define active ingredients, build your team, and create a structured implementation plan
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ingredients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ingredients">Active Ingredients</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="pd">Professional Development</TabsTrigger>
        </TabsList>

        {/* Active Ingredients Tab */}
        <TabsContent value="ingredients" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle>Active Ingredients Mapper</CardTitle>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              </div>
              <CardDescription>
                Define core practices (non-negotiable) and adaptable elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActiveIngredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{ingredient.name}</h4>
                        {ingredient.isCore ? (
                          <Badge variant="default">Core</Badge>
                        ) : (
                          <Badge variant="secondary">Adaptable</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{ingredient.category}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Look-Fors & Fidelity Measures</CardTitle>
              <CardDescription>
                What should observers see when this is implemented well?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActiveIngredients.filter(i => i.isCore).map((ingredient) => (
                  <div key={ingredient.id} className="rounded-lg border p-3">
                    <p className="font-medium text-sm mb-2">{ingredient.name}</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Sessions happen daily at scheduled time</li>
                      <li>• All pupils actively participating</li>
                      <li>• Teacher following lesson structure</li>
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Implementation Team</CardTitle>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
              <CardDescription>
                Who's responsible for driving this forward?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockTeam.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles & Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Implementation Lead</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Coordinate overall implementation</li>
                  <li>• Monitor fidelity and provide coaching</li>
                  <li>• Facilitate team meetings and PDSA cycles</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Year Lead</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Support classroom teachers with planning</li>
                  <li>• Model effective practices</li>
                  <li>• Collect weekly progress data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Implementation Timeline</CardTitle>
              </div>
              <CardDescription>
                Phased approach with clear milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeline.map((phase, index) => (
                  <div key={phase.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        phase.status === "complete" ? "border-success bg-success text-success-foreground" :
                        phase.status === "in-progress" ? "border-primary bg-primary text-primary-foreground" :
                        "border-muted-foreground/25 bg-background text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      {index < mockTimeline.length - 1 && (
                        <div className="h-full w-[2px] bg-border my-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{phase.phase}</h4>
                        <Badge variant={
                          phase.status === "complete" ? "default" :
                          phase.status === "in-progress" ? "secondary" :
                          "outline"
                        }>
                          {phase.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{phase.date}</p>
                      <p className="text-sm text-muted-foreground">{phase.tasks} tasks</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Risk Register</CardTitle>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Risk
                </Button>
              </div>
              <CardDescription>
                Identify potential barriers and mitigation strategies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { risk: "Staff workload concerns", impact: "High", mitigation: "Restructure timetable, embed in existing practice" },
                { risk: "Variable buy-in from teachers", impact: "Medium", mitigation: "Early involvement, peer modeling, quick wins" },
                { risk: "Resource delivery delays", impact: "Low", mitigation: "Order early, identify backup materials" },
              ].map((item, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.risk}</h4>
                    <Badge variant={item.impact === "High" ? "destructive" : item.impact === "Medium" ? "secondary" : "outline"}>
                      {item.impact} Impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Mitigation:</span> {item.mitigation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Development Tab */}
        <TabsContent value="pd" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Development Plan</CardTitle>
              <CardDescription>
                Training, coaching, and ongoing support schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { session: "Initial Training", date: "Oct 15", duration: "3 hours", participants: "All teachers" },
                { session: "Lesson Planning Workshop", date: "Oct 22", duration: "1.5 hours", participants: "Year 3 team" },
                { session: "Coaching Observations", date: "Nov onwards", duration: "30 min/week", participants: "Individual" },
                { session: "Team Reflection Meetings", date: "Monthly", duration: "1 hour", participants: "Implementation team" },
              ].map((session, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{session.session}</h4>
                    <span className="text-sm text-muted-foreground">{session.date}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Duration: {session.duration}</span>
                    <span>•</span>
                    <span>Participants: {session.participants}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline">Save as Draft</Button>
        <Button>Complete Planning & Move to Implement</Button>
      </div>
    </div>
  );
}
