import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface SMARTCriteriaCheckerProps {
  goals: string;
}

interface CriteriaCheck {
  name: string;
  met: boolean;
  hint: string;
  pattern: RegExp | ((text: string) => boolean);
}

export function SMARTCriteriaChecker({ goals }: SMARTCriteriaCheckerProps) {
  const [checks, setChecks] = useState<CriteriaCheck[]>([]);

  useEffect(() => {
    const criteriaChecks: CriteriaCheck[] = [
      {
        name: "Specific",
        met: goals.length > 50,
        hint: "Goals should be detailed and clear (at least 50 characters)",
        pattern: () => goals.length > 50,
      },
      {
        name: "Measurable",
        met: /\d+%|\d+ (students|pupils|percent)/.test(goals),
        hint: "Include specific numbers or percentages",
        pattern: /\d+%|\d+ (students|pupils|percent)/,
      },
      {
        name: "Achievable",
        met: /\b(will|can|aim|target|achieve|increase|improve|reach)\b/i.test(goals),
        hint: "Use action words like 'will', 'achieve', 'increase'",
        pattern: /\b(will|can|aim|target|achieve|increase|improve|reach)\b/i,
      },
      {
        name: "Relevant",
        met: /\b(students?|pupils?|learning|academic|attainment|progress)\b/i.test(goals),
        hint: "Mention students, learning, or educational outcomes",
        pattern: /\b(students?|pupils?|learning|academic|attainment|progress)\b/i,
      },
      {
        name: "Time-bound",
        met: /\b(by|before|until|within|202\d|january|february|march|april|may|june|july|august|september|october|november|december|term|year)\b/i.test(goals),
        hint: "Include a specific deadline or timeframe",
        pattern: /\b(by|before|until|within|202\d|january|february|march|april|may|june|july|august|september|october|november|december|term|year)\b/i,
      },
    ];

    setChecks(criteriaChecks.map(check => ({
      ...check,
      met: typeof check.pattern === 'function' ? check.pattern(goals) : check.pattern.test(goals)
    })));
  }, [goals]);

  if (!goals || goals.length < 10) {
    return null;
  }

  const metCount = checks.filter(c => c.met).length;
  const allMet = metCount === checks.length;

  return (
    <Card className={allMet ? "border-green-500/50" : "border-yellow-500/50"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {allMet ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            SMART Criteria Check
          </CardTitle>
          <Badge variant={allMet ? "default" : "secondary"}>
            {metCount}/{checks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            {check.met ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className={check.met ? "text-foreground font-medium" : "text-muted-foreground"}>
                {check.name}
              </span>
              {!check.met && (
                <p className="text-xs text-muted-foreground mt-0.5">{check.hint}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}