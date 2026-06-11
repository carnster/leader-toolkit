import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ericLabel } from "@/lib/ericClusters";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-brief`;

export default function SharedView() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(FN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ token }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load");
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load the shared plan.");
      }
    })();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { initiative, brief, ingredients, strategies, milestones, team } = data;
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="container max-w-3xl py-8">
          <p className="text-xs uppercase tracking-widest opacity-80 mb-2">IMPACT Implementation Companion · Shared read-only view</p>
          <h1 className="text-3xl font-bold">{initiative?.title}</h1>
          {initiative?.description && <p className="mt-2 opacity-90">{initiative.description}</p>}
        </div>
      </header>
      <main className="container max-w-3xl py-8 space-y-6">
        {brief && (
          <Card>
            <CardHeader><CardTitle>Decision Brief</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[["Problem", brief.problem_statement], ["Target Group", brief.target_group], ["Baseline", brief.baseline_data], ["Goals", brief.goals], ["Chosen Approach", brief.chosen_approach], ["Evidence Base", brief.evidence_base], ["Equity Considerations", brief.equity_notes]]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k as string}>
                    <p className="font-medium">{k}</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{v}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
        {ingredients.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Active Ingredients</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {ingredients.map((i: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant={i.is_core ? "destructive" : "secondary"} className="mt-0.5">{i.is_core ? "CORE" : "Adaptable"}</Badge>
                  <div><span className="font-medium">{i.name}</span>{i.description && <p className="text-muted-foreground">{i.description}</p>}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {strategies.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Implementation Strategies</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {strategies.map((s: any, idx: number) => (
                <div key={idx}>
                  <span className="font-medium">{s.strategy_name}</span>{" "}
                  <Badge variant="outline" className="ml-1">{ericLabel(s.eric_category)}</Badge>
                  {s.target_barrier && <p className="text-muted-foreground">Addresses: {s.target_barrier}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {milestones.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {milestones.map((m: any, idx: number) => (
                <div key={idx} className="flex justify-between gap-4">
                  <span>{m.milestone}</span>
                  <span className="text-muted-foreground shrink-0">{m.target_date ? format(new Date(m.target_date), "PP") : ""}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {team.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Implementation Team</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {team.map((m: any) => `${m.name} (${m.role_in_initiative})`).join(" · ")}
            </CardContent>
          </Card>
        )}
        <p className="flex items-center gap-2 text-xs text-muted-foreground pb-8">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Read-only view shared from the IMPACT Implementation Companion. Built on the Implement with IMPACT framework.
        </p>
      </main>
    </div>
  );
}
