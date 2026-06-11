import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { usePDSACycles } from "@/hooks/usePDSACycles";
import { useIndicators } from "@/hooks/useIndicators";

interface SustainGateProps {
  initiativeId: string;
}

interface GateTest {
  name: string;
  passed: boolean;
  evidence: string;
  nextAction: string;
  href: string;
}

/**
 * The bar for entering Spread & Sustain, per Implement with IMPACT: the work
 * has stopped being a learning project and become how the building operates.
 * Advisory, not a lock: leader judgment can proceed past it, on the record.
 */
export function SustainGate({ initiativeId }: SustainGateProps) {
  const { fidelityLogs } = useFidelityLogs(initiativeId);
  const { pdsaCycles } = usePDSACycles(initiativeId);
  const { indicators, indicatorValues } = useIndicators(initiativeId);
  const [overridden, setOverridden] = useState(false);

  const logs = (fidelityLogs as any[]) || [];
  const recent = [...logs]
    .sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())
    .slice(0, 10);
  const avgRecent = recent.length
    ? recent.reduce((s, l) => s + (l.rating || 0), 0) / recent.length
    : 0;
  const spanDays = logs.length >= 2
    ? Math.round(
        (Math.max(...logs.map((l) => +new Date(l.observed_at))) -
          Math.min(...logs.map((l) => +new Date(l.observed_at)))) / 86400000
      )
    : 0;
  const actionedPdsa = (pdsaCycles as any[]).filter((c) => c.decision || c.status === "complete");
  const valuedIndicators = new Set((indicatorValues as any[]).map((v) => v.indicator_id)).size;

  const tests: GateTest[] = [
    {
      name: "Fidelity is high, stable, and broad",
      passed: recent.length >= 3 && avgRecent >= 4,
      evidence: recent.length
        ? `${logs.length} observations; recent average ${avgRecent.toFixed(1)} of 5`
        : "No observations recorded",
      nextAction: "Keep observing until recent ratings hold at 4+ across at least 3 observations",
      href: "/implement",
    },
    {
      name: "An improvement cycle reached an actioned decision",
      passed: actionedPdsa.length > 0,
      evidence: actionedPdsa.length
        ? `${actionedPdsa.length} PDSA ${actionedPdsa.length === 1 ? "cycle" : "cycles"} with a decision`
        : `${(pdsaCycles as any[]).length} cycles, none decided yet`,
      nextAction: "Complete a PDSA cycle through Study and Act: adopt, adapt, or abandon",
      href: "/implement",
    },
    {
      name: "Leading indicators are flowing",
      passed: indicators.length > 0 && valuedIndicators > 0,
      evidence: indicators.length
        ? `${valuedIndicators} of ${indicators.length} indicators have recorded values`
        : "No indicators defined",
      nextAction: "Record values for your leading indicators in the Monitoring Hub",
      href: "/monitor",
    },
    {
      name: "Monitoring rhythm has held over time",
      passed: spanDays >= 14,
      evidence: spanDays > 0
        ? `Observation record spans ${spanDays} days`
        : "Not enough history to judge a rhythm",
      nextAction: "Sustain the observation cadence for at least two weeks of real history",
      href: "/monitor",
    },
  ];

  const passedCount = tests.filter((t) => t.passed).length;
  const ready = passedCount === tests.length;

  if (ready) {
    return (
      <Card className="border-[hsl(var(--stage-sustain))]/40 bg-[hsl(var(--stage-sustain))]/5">
        <CardContent className="pt-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-[hsl(var(--stage-sustain))]" aria-hidden="true" />
          <div>
            <p className="font-semibold">The evidence clears the bar for Spread & Sustain</p>
            <p className="text-sm text-muted-foreground">
              Fidelity holds, an improvement cycle reached a decision, indicators are flowing, and the rhythm has held. The work below is now yours: embed it, protect it, and decide about scale.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[hsl(var(--stage-sustain))]/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[hsl(var(--stage-sustain))]" aria-hidden="true" />
            Ready for Spread & Sustain?
          </CardTitle>
          <Badge variant="secondary">{passedCount}/{tests.length} criteria met</Badge>
        </div>
        <CardDescription>
          The bar, per the framework: the work has stopped being a learning project and become how the building operates. Each test reads your live data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tests.map((t) => (
          <div key={t.name} className="flex items-start gap-2 text-sm">
            {t.passed ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stage-sustain))] flex-shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="flex-1">
              <span className={t.passed ? "font-medium" : "font-medium text-muted-foreground"}>{t.name}</span>
              <p className="text-xs text-muted-foreground">{t.evidence}</p>
              {!t.passed && (
                <p className="text-xs mt-0.5">
                  <Link to={`${t.href}?initiative=${initiativeId}`} className="text-accent underline underline-offset-2">
                    {t.nextAction}
                  </Link>
                </p>
              )}
            </div>
          </div>
        ))}
        {!overridden ? (
          <div className="pt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <p>
              Entering sustainment before the evidence clears risks embedding a practice that was never fully implemented.
              If your professional judgment says the data lags reality, you can{" "}
              <Button variant="link" className="h-auto p-0 text-xs underline" onClick={() => setOverridden(true)}>
                proceed on leader judgment
              </Button>.
            </p>
          </div>
        ) : (
          <p className="pt-2 text-xs text-muted-foreground italic">
            Proceeding on leader judgment. The criteria above stay visible so the team knows what evidence is still owed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
