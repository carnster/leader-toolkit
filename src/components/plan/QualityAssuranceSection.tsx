import { FidelityMonitoringPlan } from "@/components/FidelityMonitoringPlan";
import { AdaptationProtocol } from "@/components/AdaptationProtocol";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface QualityAssuranceSectionProps {
  activeIngredients: ActiveIngredient[];
  initiativeId: string;
}

export function QualityAssuranceSection({ activeIngredients, initiativeId }: QualityAssuranceSectionProps) {
  return (
    <div className="space-y-6">
      <FidelityMonitoringPlan activeIngredients={activeIngredients} initiativeId={initiativeId} />
      <AdaptationProtocol activeIngredients={activeIngredients} />
    </div>
  );
}
