import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useImplementationRisks } from "@/hooks/useImplementationRisks";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";

interface RiskStrategyMappingProps {
  initiativeId: string;
}

export function RiskStrategyMapping({ initiativeId }: RiskStrategyMappingProps) {
  const { risks } = useImplementationRisks(initiativeId);
  const { strategies } = useImplementationStrategies(initiativeId);
  
  const activeRisks = risks.filter(r => r.status === "active");
  
  // Calculate risk scores
  const getRiskScore = (risk: any) => {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[risk.likelihood as keyof typeof scores] * scores[risk.impact as keyof typeof scores];
  };
  
  // Sort risks by score (highest first)
  const sortedRisks = [...activeRisks].sort((a, b) => getRiskScore(b) - getRiskScore(a));
  
  // Group strategies by ERIC category
  const strategiesByCategory = strategies.reduce((acc, strategy) => {
    if (!acc[strategy.eric_category]) {
      acc[strategy.eric_category] = [];
    }
    acc[strategy.eric_category].push(strategy);
    return acc;
  }, {} as Record<string, typeof strategies>);
  
  const getRiskBadgeColor = (score: number) => {
    if (score >= 6) return "destructive";
    if (score >= 4) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Bidirectional View */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Risk-Strategy Connections</CardTitle>
          </div>
          <CardDescription>
            Bidirectional view: How risks inform strategy selection AND how strategies mitigate risks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Direction 1: Risks → Strategies */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Risks Requiring Strategic Response
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Each risk should be addressed by one or more implementation strategies
            </p>
            <div className="space-y-4">
              {sortedRisks.map((risk) => {
                const riskScore = getRiskScore(risk);
                const relatedStrategies = strategies.filter(
                  s => s.target_barrier?.toLowerCase().includes(risk.risk_category.toLowerCase()) ||
                       s.description?.toLowerCase().includes(risk.risk_category.toLowerCase())
                );
                
                return (
                  <div key={risk.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getRiskBadgeColor(riskScore)}>
                            Score: {riskScore}/9
                          </Badge>
                          <Badge variant="outline">{risk.risk_category}</Badge>
                        </div>
                        <p className="text-sm font-medium">{risk.risk_description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pl-4 border-l-2 border-primary/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Mitigation Strategy: {risk.mitigation_strategy}
                      </p>
                      {relatedStrategies.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-primary flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            Addressed by {relatedStrategies.length} implementation {relatedStrategies.length === 1 ? 'strategy' : 'strategies'}:
                          </p>
                          {relatedStrategies.map((strategy) => (
                            <div key={strategy.id} className="text-xs p-2 rounded bg-primary/5 border border-primary/20">
                              <Badge variant="secondary" className="text-[10px] mb-1">
                                {strategy.eric_category}
                              </Badge>
                              <p className="font-medium">{strategy.strategy_name}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>No implementation strategies currently address this risk</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Direction 2: Strategies → Risks */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Strategy Coverage Analysis
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Review which risks each strategy addresses and identify coverage gaps
            </p>
            <div className="space-y-3">
              {Object.entries(strategiesByCategory).map(([category, categoryStrategies]) => (
                <div key={category} className="p-4 rounded-lg border bg-muted/30">
                  <h5 className="font-semibold text-sm mb-2">{category}</h5>
                  <div className="space-y-2">
                    {categoryStrategies.map((strategy) => {
                      const addressedRisks = risks.filter(
                        r => strategy.target_barrier?.toLowerCase().includes(r.risk_category.toLowerCase()) ||
                             strategy.description?.toLowerCase().includes(r.risk_category.toLowerCase())
                      );
                      
                      return (
                        <div key={strategy.id} className="p-3 rounded-lg border bg-card">
                          <p className="text-sm font-medium mb-2">{strategy.strategy_name}</p>
                          {addressedRisks.length > 0 ? (
                            <div className="flex items-center gap-2 text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Mitigates {addressedRisks.length} identified {addressedRisks.length === 1 ? 'risk' : 'risks'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <AlertCircle className="h-3 w-3" />
                              <span>No direct risk mitigation identified</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Coverage Summary */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h5 className="font-semibold text-sm mb-2">Coverage Summary</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Active Risks</p>
                <p className="text-2xl font-bold">{activeRisks.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Implementation Strategies</p>
                <p className="text-2xl font-bold">{strategies.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
