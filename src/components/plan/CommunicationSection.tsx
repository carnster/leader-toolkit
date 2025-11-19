import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CommunicationPlan } from "@/components/CommunicationPlan";

interface CommunicationSectionProps {
  initiativeId: string;
}

export function CommunicationSection({ initiativeId }: CommunicationSectionProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Communication & Stakeholder Engagement</CardTitle>
          </div>
          <CardDescription>
            Build a comprehensive communication strategy to engage stakeholders, build buy-in, and sustain implementation momentum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">Why Communication Matters</h4>
              <p className="text-sm text-muted-foreground">
                Effective communication builds stakeholder understanding, addresses concerns, and creates champions for your initiative.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">Strategic Approach</h4>
              <p className="text-sm text-muted-foreground">
                Target different stakeholder groups with tailored messaging through appropriate channels at key milestones.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">Implementation Science</h4>
              <p className="text-sm text-muted-foreground">
                Communication is a critical ERIC strategy that supports stakeholder relationships and engagement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Plan */}
      <CommunicationPlan initiativeId={initiativeId} />
    </div>
  );
}
