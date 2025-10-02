import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, Package, Users } from "lucide-react";

export function ResourceAllocation() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle>Resource Allocation & Budget</CardTitle>
        </div>
        <CardDescription>
          Detailed breakdown of resources, time commitments, and budget requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Categories */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Professional Development</p>
                <p className="text-xs text-muted-foreground">Training, coaching, materials</p>
              </div>
              <Badge variant="outline">$___</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Personnel Time</p>
                <p className="text-xs text-muted-foreground">Release time, stipends, substitutes</p>
              </div>
              <Badge variant="outline">$___</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Materials & Supplies</p>
                <p className="text-xs text-muted-foreground">Curriculum, tools, technology</p>
              </div>
              <Badge variant="outline">$___</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Technology & Infrastructure</p>
                <p className="text-xs text-muted-foreground">Software, hardware, platforms</p>
              </div>
              <Badge variant="outline">$___</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Evaluation & Monitoring</p>
                <p className="text-xs text-muted-foreground">Data collection, analysis tools</p>
              </div>
              <Badge variant="outline">$___</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border bg-primary/5">
              <p className="font-semibold">Total Estimated Cost</p>
              <Badge variant="default">$___</Badge>
            </div>
          </div>
        </div>

        {/* Time Commitments */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Commitments by Role
          </h4>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">Direct Implementers</span>
                <Badge variant="secondary">___ hrs/week</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Delivery time + planning + PD participation</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">Implementation Coach</span>
                <Badge variant="secondary">___ hrs/week</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Observations, feedback, coordination</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">Team Lead/Coordinator</span>
                <Badge variant="secondary">___ hrs/week</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Planning, data review, problem-solving</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">School Leadership</span>
                <Badge variant="secondary">___ hrs/month</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Check-ins, remove barriers, resource allocation</p>
            </div>
          </div>
        </div>

        {/* Materials & Supplies */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materials & Supplies Needed
          </h4>
          <div className="grid gap-2">
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">Curriculum Materials</p>
              <p className="text-xs text-muted-foreground">
                • Intervention manuals/guides<br />
                • Student workbooks/materials<br />
                • Assessment tools
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">Professional Development</p>
              <p className="text-xs text-muted-foreground">
                • Training materials<br />
                • Fidelity observation tools<br />
                • Coaching protocols
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">Technology/Tools</p>
              <p className="text-xs text-muted-foreground">
                • Required software/platforms<br />
                • Data tracking systems<br />
                • Communication tools
              </p>
            </div>
          </div>
        </div>

        {/* Funding Sources */}
        <div>
          <h4 className="font-semibold mb-3">Funding Sources & Strategy</h4>
          <div className="space-y-2 text-sm">
            <div className="p-3 rounded-lg border">
              <span className="font-medium">School/District Budget: </span>
              <span className="text-muted-foreground">General operating funds, professional development budget</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Grants: </span>
              <span className="text-muted-foreground">Title I, Title II, state/federal competitive grants</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Reallocation: </span>
              <span className="text-muted-foreground">Repurpose existing resources or staff time</span>
            </div>
            <div className="p-3 rounded-lg border">
              <span className="font-medium">Community Partnerships: </span>
              <span className="text-muted-foreground">Local businesses, nonprofits, volunteer support</span>
            </div>
          </div>
        </div>

        {/* Resource Protection */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">Resource Protection Plan</h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Critical:</strong> Identify resources that are essential and cannot be cut, even in budget constraints.
            Establish contingency plans for maintaining core resources if funding is reduced.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
