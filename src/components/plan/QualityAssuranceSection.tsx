import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface QualityAssuranceSectionProps {
  activeIngredients: ActiveIngredient[];
  initiativeId: string;
}

export function QualityAssuranceSection({ activeIngredients, initiativeId }: QualityAssuranceSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <CardTitle>Quality Assurance Guidelines</CardTitle>
          </div>
          <CardDescription>
            Adaptation boundaries and monitoring plans have been moved to where they're actively used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Adaptation Protocol</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Define core vs. adaptable elements when editing Active Ingredients in the Strategic Foundation section.
            </p>
            <p className="text-xs text-muted-foreground">
              💡 Each ingredient can be marked as CORE (non-negotiable) or ADAPTABLE with clear boundaries.
            </p>
          </div>
          
          <div className="p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Fidelity Monitoring</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Observation scheduling and fidelity tracking happen in the Monitoring Hub, which runs throughout implementation.
            </p>
            <p className="text-xs text-muted-foreground">
              💡 Visit the Monitoring Hub to conduct observations, view fidelity trends, and manage your monitoring calendar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
