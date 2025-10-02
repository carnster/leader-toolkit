import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lightbulb } from "lucide-react";

interface FeasibilityRedFlagsProps {
  factors: {
    time_scheduling: number;
    staff_capacity: number;
    resources_budget: number;
    leadership_support: number;
    school_culture: number;
  };
}

interface RedFlag {
  factor: string;
  score: number;
  warning: string;
  suggestions: string[];
}

export function FeasibilityRedFlags({ factors }: FeasibilityRedFlagsProps) {
  const lowThreshold = 4;
  
  const factorInfo = {
    time_scheduling: {
      name: "Time & Scheduling",
      suggestions: [
        "Reduce scope for initial implementation",
        "Phase rollout over longer period",
        "Negotiate protected planning time with leadership",
      ]
    },
    staff_capacity: {
      name: "Staff Capacity",
      suggestions: [
        "Arrange additional training sessions",
        "Identify internal experts who can mentor others",
        "Consider external coaching support",
      ]
    },
    resources_budget: {
      name: "Resources & Budget",
      suggestions: [
        "Apply for grants or additional funding",
        "Explore free or low-cost alternatives",
        "Prioritize essential resources for initial phase",
      ]
    },
    leadership_support: {
      name: "Leadership Support",
      suggestions: [
        "Present data-driven case to leadership",
        "Align initiative with school priorities",
        "Request protected time and resources formally",
      ]
    },
    school_culture: {
      name: "School Culture",
      suggestions: [
        "Build buy-in through pilot with willing teachers",
        "Celebrate early wins publicly",
        "Address concerns through open dialogue",
      ]
    },
  };

  const redFlags: RedFlag[] = Object.entries(factors)
    .filter(([_, score]) => score <= lowThreshold && score > 0)
    .map(([key, score]) => ({
      factor: factorInfo[key as keyof typeof factorInfo].name,
      score,
      warning: `${factorInfo[key as keyof typeof factorInfo].name} rated ${score}/10 indicates significant barriers`,
      suggestions: factorInfo[key as keyof typeof factorInfo].suggestions,
    }));

  if (redFlags.length === 0) {
    return null;
  }

  const severity = redFlags.length >= 3 ? "high" : redFlags.some(f => f.score <= 2) ? "high" : "medium";

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Feasibility Concerns Detected
          </CardTitle>
          <Badge variant={severity === "high" ? "destructive" : "secondary"}>
            {severity === "high" ? "High Risk" : "Moderate Risk"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The following areas scored low and may impact implementation success. Consider these mitigation strategies:
        </p>
        
        {redFlags.map((flag, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <div>
                <span className="font-medium text-sm">{flag.factor}</span>
                <span className="text-xs text-muted-foreground ml-2">({flag.score}/10)</span>
              </div>
            </div>
            
            <div className="ml-6 space-y-2">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Suggested Actions:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {flag.suggestions.map((suggestion, idx) => (
                      <li key={idx}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {severity === "high" && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive mb-1">Critical Warning:</p>
            <p className="text-xs text-muted-foreground">
              Multiple low scores suggest this initiative may face serious implementation challenges. 
              Consider addressing these concerns before proceeding or significantly reducing scope.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}