import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Settings, ArrowRight } from "lucide-react";
import { FidelityMonitoringPlan } from "@/components/FidelityMonitoringPlan";
import { AdaptationProtocol } from "@/components/AdaptationProtocol";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface QualityAssuranceSectionProps {
  activeIngredients: ActiveIngredient[];
  initiativeId: string;
  /** "fidelity" or "adaptation", from the sidebar. Anything else shows both. */
  section?: string;
}

/** Both halves of quality assurance, rendered in place.
 *
 *  This used to be a card explaining that fidelity monitoring "happens in the
 *  Monitoring Hub" and adaptation boundaries are set "when editing Active
 *  Ingredients". Both sidebar entries pointed here, so clicking either one
 *  produced a page telling you to go somewhere else. Reading where the feature
 *  went is not the same as using it, so the real components now render here. */
export function QualityAssuranceSection({
  activeIngredients,
  initiativeId,
  section,
}: QualityAssuranceSectionProps) {
  const showFidelity = section !== "adaptation";
  const showAdaptation = section !== "fidelity";

  if (activeIngredients.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <Eye className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="text-muted-foreground">
            Quality assurance starts with your active ingredients. Fidelity monitoring tracks
            whether the core practices are showing up; adaptation boundaries define how much room
            there is to adjust the rest.
          </p>
          <p className="text-sm text-muted-foreground">
            Add active ingredients first in{" "}
            <Link
              to={`/plan?section=ingredients&initiative=${initiativeId}`}
              className="text-primary underline underline-offset-2 font-medium"
            >
              Strategic Foundation
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showFidelity && (
        <div id="fidelity-monitoring">
          <FidelityMonitoringPlan
            activeIngredients={activeIngredients}
            initiativeId={initiativeId}
          />
        </div>
      )}

      {showAdaptation && (
        <div id="adaptation-protocol" className="space-y-3">
          <AdaptationProtocol activeIngredients={activeIngredients} />
          <Card className="border-dashed">
            <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Core and adaptable status, and each ingredient's boundaries, are set on the
                  ingredient itself.
                </p>
              </div>
              <Link
                to={`/plan?section=ingredients&initiative=${initiativeId}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2"
              >
                Edit ingredients
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
