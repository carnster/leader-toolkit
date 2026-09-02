import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, CalendarClock, ShieldCheck, ArrowRight, ListChecks, Plus } from "lucide-react";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { MandateBriefDialog } from "@/components/MandateBriefDialog";
import { AddCorePracticeDialog } from "@/components/AddCorePracticeDialog";

// Renders one look-for. Two-dimension look-fors are stored as strings prefixed
// "Delivery:" / "Enactment:"; surface that label without depending on it.
function LookFor({ text }: { text: string }) {
  const match = /^(Delivery|Enactment):\s*(.*)$/i.exec(text);
  if (match) {
    return (
      <li className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{match[1]}:</span> {match[2]}
      </li>
    );
  }
  return <li className="text-sm text-muted-foreground">{text}</li>;
}

export default function FastTrack() {
  const navigate = useNavigate();
  const { initiativeId } = useInitiativeContext();
  const { initiatives, updateInitiative, isUpdating } = useInitiatives();
  const { activeIngredients, isLoading } = useActiveIngredients(initiativeId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const initiative = initiatives.find((i) => i.id === initiativeId);
  const coreIngredients = (activeIngredients || []).filter((i) => i.is_core);

  // No initiative selected: offer to start one.
  if (!initiativeId || !initiative) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
          Fast Track
        </div>
        <h1 className="text-3xl font-bold">District Initiative</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          When a district hands down an initiative and the clock is already running, Fast Track skips
          the choosing and gets you straight to the core practices you have to implement well.
        </p>
        <Card className="mt-6">
          <CardContent className="pt-6 text-center space-y-3">
            <Zap className="h-10 w-10 text-amber-500 mx-auto" aria-hidden="true" />
            <p className="text-muted-foreground">
              Start a district-directed initiative, or pick an existing one from the{" "}
              <Link to="/" className="text-accent underline underline-offset-2 font-medium">
                Dashboard
              </Link>
              .
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Start a District Initiative
            </Button>
          </CardContent>
        </Card>
        <MandateBriefDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  // An ordinary (full-build) initiative landed here: send them to the real flow
  // rather than showing a stripped view of work that has its own home.
  if (initiative.mode !== "fast_track") {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Fast Track</h1>
        <Card className="mt-6">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{initiative.title}</span> is on the full
              build, not Fast Track. Continue it in the normal stages.
            </p>
            <Button asChild variant="outline">
              <Link to={`/plan?initiative=${initiative.id}`}>Open in Plan &amp; Prepare</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mandate = initiative.mandate || {};
  const nonneg = mandate.nonnegotiables || [];

  const handleExpand = () => {
    updateInitiative(
      { id: initiative.id, mode: "full", stage: "plan" },
      { onSuccess: () => navigate(`/plan?initiative=${initiative.id}`) }
    );
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-700 dark:text-amber-400 gap-1"
            >
              <Zap className="h-3 w-3" aria-hidden="true" />
              Fast Track
            </Badge>
            {initiative.target_end_date && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Due {initiative.target_end_date}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold">{initiative.title}</h1>
          {mandate.practice && (
            <p className="text-muted-foreground mt-1">
              District-directed: <span className="font-medium text-foreground">{mandate.practice}</span>
            </p>
          )}
        </div>
      </div>

      {/* Mandate context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The mandate</CardTitle>
          <CardDescription>Recorded as the district stated it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mandate.rationale ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Why the district says
              </p>
              <p className="text-sm">{mandate.rationale}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No rationale was recorded.</p>
          )}

          {nonneg.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Non-negotiables
              </p>
              <ul className="list-disc list-inside space-y-1">
                {nonneg.map((n, i) => (
                  <li key={i} className="text-sm">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* The core practices: the floor */}
      <div>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-xl font-semibold">If you do only these, do these</h2>
          </div>
          {coreIngredients.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add a core practice
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          The core practices of {mandate.practice || "this initiative"}. Drop one and you have not
          actually implemented the mandate, no matter what else is in place. Each carries the one
          look-for that tells you whether it is real, in Delivery and in Enactment.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading core practices...</p>
        ) : coreIngredients.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <ShieldCheck className="h-9 w-9 text-accent mx-auto" aria-hidden="true" />
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {mandate.not_in_library
                  ? "This practice is not in the library, so name its core practices yourself: the few that have to be right for the mandate to count, each with a look-for. Three to five is usually enough."
                  : "The core practices did not load for this initiative. Add them by hand below, or delete it and start again to retry the import."}
              </p>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add a core practice
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {coreIngredients.map((ing) => (
              <Card key={ing.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-accent" aria-hidden="true" />
                    {ing.name}
                  </CardTitle>
                  {ing.description && (
                    <CardDescription>{ing.description}</CardDescription>
                  )}
                </CardHeader>
                {ing.look_fors && ing.look_fors.length > 0 && (
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {ing.look_fors.map((lf, i) => (
                        <LookFor key={i} text={lf} />
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Upgrade path */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold mb-1">Ready to go deeper?</h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              A mandate that sticks around earns the full treatment: the adaptable practices, a real
              plan, the team, and the full fidelity cycle. Expanding keeps everything you have here.
            </p>
          </div>
          <Button onClick={handleExpand} disabled={isUpdating}>
            {isUpdating ? "Expanding..." : "Expand to full build"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>

      <AddCorePracticeDialog
        initiativeId={initiative.id}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}
