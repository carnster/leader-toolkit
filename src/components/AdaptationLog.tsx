import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { format } from "date-fns";
import { useAdaptations, type AdaptationRequest } from "@/hooks/useAdaptations";
import { useAuth } from "@/hooks/useAuth";
import { useInitiatives } from "@/hooks/useInitiatives";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface AdaptationLogProps {
  initiativeId: string;
  activeIngredients: ActiveIngredient[];
}

const DECISION_BADGES: Record<AdaptationRequest["decision"], { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  pending: { label: "Pending decision", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  approved_with_conditions: { label: "Approved with conditions", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function AdaptationLog({ initiativeId, activeIngredients }: AdaptationLogProps) {
  const { adaptations, propose, decide } = useAdaptations(initiativeId);
  const { user } = useAuth();
  const { initiatives } = useInitiatives();
  const initiative = initiatives.find((i) => i.id === initiativeId);
  // Only hide the decision controls once we positively know the viewer is not the owner;
  // while data is loading, leave them visible (the mutation itself is still guarded).
  const isOwner = !initiative || !user ? true : initiative.owner_id === user.id;
  const [open, setOpen] = useState(false);
  const [ingredientId, setIngredientId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [rationale, setRationale] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionRationale, setDecisionRationale] = useState("");

  const selected = activeIngredients.find((i) => i.id === ingredientId);
  const ingredientName = (id: string | null) => activeIngredients.find((i) => i.id === id)?.name || "General practice";

  const submit = () => {
    propose({
      ingredient_id: ingredientId || null,
      description,
      rationale,
      touches_core: !!selected?.is_core,
    });
    setOpen(false);
    setIngredientId("");
    setDescription("");
    setRationale("");
  };

  const recordDecision = (id: string, decision: AdaptationRequest["decision"]) => {
    decide({ id, decision, decision_rationale: decisionRationale });
    setDecidingId(null);
    setDecisionRationale("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Adaptation Protocol</CardTitle>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Propose Adaptation
          </Button>
        </div>
        <CardDescription>
          Thoughtful adaptation keeps the practice alive in your context; silent drift on core
          ingredients is de-implementation. Every proposal gets checked, decided, and logged.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {adaptations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No adaptations proposed yet. When someone wants to change how a practice runs,
            log it here so the change is a decision, not a drift.
          </p>
        ) : (
          adaptations.map((a) => {
            const badge = DECISION_BADGES[a.decision];
            return (
              <div key={a.id} className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {a.touches_core && (
                      <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" /> Core</Badge>
                    )}
                    <span className="text-sm font-medium">{ingredientName(a.ingredient_id)}</span>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="text-sm">{a.description}</p>
                {a.rationale && <p className="text-xs text-muted-foreground">Why: {a.rationale}</p>}
                {a.decision !== "pending" && a.decision_rationale && (
                  <p className="text-xs text-muted-foreground">Decision notes: {a.decision_rationale}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Proposed {format(new Date(a.created_at), "PP")}
                  {a.decided_at && ` · Decided ${format(new Date(a.decided_at), "PP")}`}
                </p>
                {a.decision === "pending" && !isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Only the initiative owner can record a decision.
                  </p>
                )}
                {a.decision === "pending" && isOwner && (
                  decidingId === a.id ? (
                    <div className="space-y-2 pt-1">
                      <Textarea
                        placeholder="Decision rationale: why approve, condition, or reject?"
                        value={decisionRationale}
                        onChange={(e) => setDecisionRationale(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => recordDecision(a.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => recordDecision(a.id, "approved_with_conditions")}>With Conditions</Button>
                        <Button size="sm" variant="destructive" onClick={() => recordDecision(a.id, "rejected")}>Reject</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDecidingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setDecidingId(a.id)}>Record Decision</Button>
                  )
                )}
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Propose an Adaptation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Which practice does this change?</Label>
              <Select value={ingredientId} onValueChange={setIngredientId}>
                <SelectTrigger><SelectValue placeholder="Select an active ingredient" /></SelectTrigger>
                <SelectContent>
                  {activeIngredients.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.is_core ? "CORE: " : ""}{i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selected?.is_core ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm flex gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  This is a <strong>core ingredient</strong>. Changing it risks de-implementation:
                  the practice may stop producing results. The team should weigh this decision
                  carefully and document the reasoning.
                </p>
              </div>
            ) : selected ? (
              <div className="rounded-md border border-[hsl(var(--stage-sustain))]/40 bg-[hsl(var(--stage-sustain))]/5 p-3 text-sm flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stage-sustain))] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p>This ingredient is adaptable. Check the proposal against its boundaries:</p>
                  {(selected.adaptable_boundaries?.length ?? 0) > 0 ? (
                    <ul className="list-disc list-inside text-muted-foreground mt-1">
                      {selected.adaptable_boundaries!.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground mt-1">No boundaries documented; use the team's judgment.</p>
                  )}
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="adapt-desc">What change is proposed?</Label>
              <Textarea id="adapt-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Run the partner-discussion step in groups of three instead of pairs in section 6-4 because of class size." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adapt-why">Why is it needed?</Label>
              <Textarea id="adapt-why" rows={2} value={rationale} onChange={(e) => setRationale(e.target.value)}
                placeholder="The context pressure driving this: class size, schedule, student needs..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!description.trim()}>Propose</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
