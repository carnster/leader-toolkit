import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import { usePsatDomains, PSAT_DOMAINS, type PsatRatings } from "@/hooks/usePsatDomains";

const RATING_SCALE = [1, 2, 3, 4, 5];

/** Program Sustainability Assessment Tool self-rating across eight domains.
 *  Low scores read as where to focus sustaining work, never as failing. */
export function PsatSustainabilityChecklist({ initiativeId }: { initiativeId: string }) {
  const { ratings, missingColumn, save } = usePsatDomains(initiativeId);
  const [local, setLocal] = useState<PsatRatings>(ratings);

  useEffect(() => {
    setLocal(ratings);
  }, [ratings]);

  if (missingColumn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" aria-hidden="true" />
            Sustainability self-assessment
          </CardTitle>
          <CardDescription>
            This will activate after the next database update for this workspace.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const setRating = (domainKey: string, value: number) => {
    const next = { ...local, [domainKey]: value };
    setLocal(next);
    save(next);
  };

  const rated = PSAT_DOMAINS.map((d) => local[d.key]).filter((v): v is number => !!v && v > 0);
  const average = rated.length > 0 ? rated.reduce((sum, v) => sum + v, 0) / rated.length : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
            Sustainability self-assessment
          </CardTitle>
          {average !== null && (
            <Badge variant="secondary">Average {average.toFixed(1)} / 5</Badge>
          )}
        </div>
        <CardDescription>
          Rate each of the eight sustainability domains from 1 to 5. Lower scores are not a failing grade,
          they are where to focus your sustaining work next.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {PSAT_DOMAINS.map((domain) => {
          const current = local[domain.key] ?? 0;
          return (
            <div key={domain.key} className="rounded-lg border p-3 space-y-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{domain.label}</p>
                <p className="text-xs text-muted-foreground">{domain.description}</p>
              </div>
              <div className="flex items-center gap-1.5" role="group" aria-label={`${domain.label} rating`}>
                {RATING_SCALE.map((value) => {
                  const active = current === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setRating(domain.key, value)}
                      aria-pressed={active}
                      className={`h-8 w-8 rounded-md border text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
                <span className="ml-2 text-xs text-muted-foreground">
                  {current > 0 ? `${current} / 5` : "Not rated"}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
