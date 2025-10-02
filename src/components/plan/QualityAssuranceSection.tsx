import { FidelityMonitoringPlan } from "@/components/FidelityMonitoringPlan";
import { AdaptationProtocol } from "@/components/AdaptationProtocol";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface QualityAssuranceSectionProps {
  activeIngredients: ActiveIngredient[];
}

export function QualityAssuranceSection({ activeIngredients }: QualityAssuranceSectionProps) {
  return (
    <div className="space-y-6">
      <FidelityMonitoringPlan activeIngredients={activeIngredients} />
      <AdaptationProtocol activeIngredients={activeIngredients} />
    </div>
  );
}
