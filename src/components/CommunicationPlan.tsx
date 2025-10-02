import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Calendar, Target } from "lucide-react";

export function CommunicationPlan() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Communication & Stakeholder Engagement</CardTitle>
        </div>
        <CardDescription>
          Strategic communication to build awareness, buy-in, and sustained support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stakeholder Groups */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Key Stakeholder Groups
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Primary</Badge>
                <span className="font-medium text-sm">Implementation Team</span>
              </div>
              <p className="text-xs text-muted-foreground">Direct implementers, coaches, coordinators</p>
              <p className="text-xs"><strong>Needs:</strong> Training, ongoing support, feedback loops</p>
            </div>
            
            <div className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Primary</Badge>
                <span className="font-medium text-sm">Students/Families</span>
              </div>
              <p className="text-xs text-muted-foreground">Target beneficiaries and their families</p>
              <p className="text-xs"><strong>Needs:</strong> Clear expectations, progress updates, involvement opportunities</p>
            </div>

            <div className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Secondary</Badge>
                <span className="font-medium text-sm">School Leadership</span>
              </div>
              <p className="text-xs text-muted-foreground">Principals, admin team, district leaders</p>
              <p className="text-xs"><strong>Needs:</strong> Progress reports, data on outcomes, resource requests</p>
            </div>

            <div className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Secondary</Badge>
                <span className="font-medium text-sm">Broader Staff</span>
              </div>
              <p className="text-xs text-muted-foreground">Teachers, support staff not directly implementing</p>
              <p className="text-xs"><strong>Needs:</strong> Awareness of initiative, how it affects them, success stories</p>
            </div>
          </div>
        </div>

        {/* Communication Timeline */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Communication Timeline
          </h4>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">Pre-Launch</span>
                <Badge variant="outline" className="text-xs">Month 0</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                • All-staff introduction • Parent information sessions • Team kickoff meeting
              </p>
            </div>

            <div className="p-3 rounded-lg border">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">Launch Phase</span>
                <Badge variant="outline" className="text-xs">Months 1-2</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                • Weekly team check-ins • Monthly leadership updates • Student/family launch event
              </p>
            </div>

            <div className="p-3 rounded-lg border">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">Implementation Phase</span>
                <Badge variant="outline" className="text-xs">Months 3-6</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                • Bi-weekly team meetings • Quarterly family updates • Monthly staff newsletters
              </p>
            </div>

            <div className="p-3 rounded-lg border">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">Sustainability Phase</span>
                <Badge variant="outline" className="text-xs">Months 6+</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                • Monthly team reflections • Semester outcome reports • Annual celebration events
              </p>
            </div>
          </div>
        </div>

        {/* Communication Methods */}
        <div>
          <h4 className="font-semibold mb-3">Communication Channels</h4>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Formal Meetings</p>
              <p className="text-xs text-muted-foreground">Team meetings, PLCs, leadership briefings</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Digital Updates</p>
              <p className="text-xs text-muted-foreground">Email newsletters, shared documents, dashboards</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Informal Check-ins</p>
              <p className="text-xs text-muted-foreground">Hallway conversations, coaching sessions</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">Family Engagement</p>
              <p className="text-xs text-muted-foreground">Parent portal updates, family nights, surveys</p>
            </div>
          </div>
        </div>

        {/* Buy-in Strategies */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Building & Maintaining Buy-in
          </h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Early Involvement: </span>
              <span className="text-muted-foreground">Engage key stakeholders in planning before launch</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Share Success Stories: </span>
              <span className="text-muted-foreground">Celebrate quick wins and student progress</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Transparent Data: </span>
              <span className="text-muted-foreground">Share both successes and challenges openly</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Two-way Communication: </span>
              <span className="text-muted-foreground">Actively seek feedback and respond to concerns</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
