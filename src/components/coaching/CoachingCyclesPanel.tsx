import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MessageSquare, CalendarCheck, CheckCircle2, Plus, Repeat } from "lucide-react";
import { useCoachingCycles, type CoachingCycle } from "@/hooks/useCoachingCycles";
import { useCommitments } from "@/hooks/useCommitments";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";

const STAGE_META: Record<CoachingCycle["stage"], { label: string; next: string | null }> = {
  observation: { label: "Observe", next: "Log the observation" },
  feedback: { label: "Feedback", next: "Record feedback + next step" },
  follow_up: { label: "Follow-up", next: "Close with outcome" },
  closed: { label: "Closed", next: null },
};

const OUTCOME_LABEL = { moved: "Practice moved", partly: "Partly moved", not_yet: "Not yet" } as const;

/** Observation -> feedback -> one agreed next step -> follow-up.
 *  Training alone rarely changes classroom practice; this loop is what does.
 *  The agreed next step is logged as a commitment so nothing evaporates. */
export function CoachingCyclesPanel({ initiativeId }: { initiativeId: string | undefined }) {
  const { cycles, openCycles, isLoading, missingTable, start, isStarting, updateAsync, isUpdating } =
    useCoachingCycles(initiativeId);
  const { createAsync: createCommitment } = useCommitments(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);

  const [startOpen, setStartOpen] = useState(false);
  const [memberChoice, setMemberChoice] = useState("free");
  const [freeName, setFreeName] = useState("");
  const [ingredientId, setIngredientId] = useState("none");

  const [advancing, setAdvancing] = useState<CoachingCycle | null>(null);
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedIngredients = useMemo(
    () => [...activeIngredients].sort((a: any, b: any) => Number(b.is_core ?? 0) - Number(a.is_core ?? 0)),
    [activeIngredients]
  );

  if (missingTable) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Coaching cycles needs a database update before observation, feedback, and follow-up can be tracked here.
        </CardContent>
      </Card>
    );
  }

  const ingredientName = (id: string | null) =>
    activeIngredients.find((i: any) => i.id === id)?.name ?? null;

  const beginStart = () => {
    setMemberChoice("free"); setFreeName(""); setIngredientId("none"); setStartOpen(true);
  };

  const submitStart = () => {
    const member = teamMembers.find((m: any) => m.id === memberChoice);
    const name = member?.name || freeName.trim();
    if (!name) return;
    start({ member_name: name, member_id: member?.id || null, focus_ingredient_id: ingredientId === "none" ? null : ingredientId });
    setStartOpen(false);
  };

  const beginAdvance = (c: CoachingCycle) => {
    setAdvancing(c); setNotes(""); setNextStep(""); setFollowUpDate("");
  };

  // Await every stage write and close the dialog ONLY on success. Closing
  // optimistically made a failed save look successful, and a resubmit after a
  // feedback-stage failure would create a second commitment for the same
  // cycle (the first one had already persisted before the update failed).
  const submitAdvance = async (outcome?: CoachingCycle["outcome"]) => {
    if (!advancing) return;
    setSaving(true);
    try {
      if (advancing.stage === "observation") {
        await updateAsync({ id: advancing.id, stage: "feedback", observation_notes: notes.trim() || null, observed_at: new Date().toISOString().slice(0, 10) });
      } else if (advancing.stage === "feedback") {
        let commitmentId: string | null = null;
        if (nextStep.trim()) {
          try {
            const c = await createCommitment({
              title: nextStep,
              source: "coaching",
              source_id: advancing.id,
              owner_name: advancing.member_name,
              due_date: followUpDate || null,
            });
            commitmentId = c.id;
          } catch {
            /* commitment creation failing should not lose the coaching notes */
          }
        }
        await updateAsync({
          id: advancing.id, stage: "follow_up", feedback_notes: notes.trim() || null,
          next_step: nextStep.trim() || null, follow_up_date: followUpDate || null, commitment_id: commitmentId,
        });
      } else if (advancing.stage === "follow_up" && outcome) {
        await updateAsync({ id: advancing.id, stage: "closed", outcome, closed_at: new Date().toISOString() });
      }
      setAdvancing(null);
    } catch {
      /* the hook's onError toast explains; keep the dialog open so nothing is lost */
    } finally {
      setSaving(false);
    }
  };

  const recentClosed = cycles.filter((c) => c.stage === "closed").slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" aria-hidden="true" />
              Coaching cycles
            </CardTitle>
            <CardDescription className="mt-1">
              Observe, give feedback, agree one next step, follow up. This is what turns PD into practice.
            </CardDescription>
          </div>
          <Button size="sm" onClick={beginStart}>
            <Plus className="mr-1 h-4 w-4" /> Start cycle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading cycles...</p>
        ) : openCycles.length === 0 && recentClosed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cycles yet. Start one after a PD session or when the pulse flags someone who needs support.
          </p>
        ) : (
          <>
            {openCycles.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.member_name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{STAGE_META[c.stage].label}</Badge>
                    {ingredientName(c.focus_ingredient_id) && (
                      <span className="text-xs text-muted-foreground">{ingredientName(c.focus_ingredient_id)}</span>
                    )}
                    {c.stage === "follow_up" && c.follow_up_date && (
                      <span className="text-xs text-muted-foreground">Follow up {c.follow_up_date}</span>
                    )}
                  </div>
                  {c.next_step && c.stage === "follow_up" && (
                    <p className="text-xs text-muted-foreground mt-1">Next step: {c.next_step}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => beginAdvance(c)}>
                  {c.stage === "observation" && <Eye className="mr-1 h-3.5 w-3.5" />}
                  {c.stage === "feedback" && <MessageSquare className="mr-1 h-3.5 w-3.5" />}
                  {c.stage === "follow_up" && <CalendarCheck className="mr-1 h-3.5 w-3.5" />}
                  {STAGE_META[c.stage].next}
                </Button>
              </div>
            ))}
            {recentClosed.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-70">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <p className="text-sm flex-1">{c.member_name}</p>
                {c.outcome && <Badge variant="outline" className="text-[10px]">{OUTCOME_LABEL[c.outcome]}</Badge>}
              </div>
            ))}
          </>
        )}
      </CardContent>

      {/* Start dialog */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a coaching cycle</DialogTitle>
            <DialogDescription>Who are you coaching, and on which practice?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Team member</Label>
              <Select value={memberChoice} onValueChange={setMemberChoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Someone else (type a name)</SelectItem>
                  {teamMembers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {memberChoice === "free" && (
                <Input value={freeName} onChange={(e) => setFreeName(e.target.value)} placeholder="Name" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Focus practice</Label>
              <Select value={ingredientId} onValueChange={setIngredientId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / not specific</SelectItem>
                  {sortedIngredients.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStartOpen(false)}>Cancel</Button>
            <Button onClick={submitStart} disabled={isStarting || (memberChoice === "free" && !freeName.trim())}>
              {isStarting ? "Starting..." : "Start cycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance dialog */}
      <Dialog open={!!advancing} onOpenChange={(o) => { if (!o) setAdvancing(null); }}>
        <DialogContent>
          {advancing?.stage === "observation" && (
            <>
              <DialogHeader>
                <DialogTitle>Log the observation</DialogTitle>
                <DialogDescription>{advancing.member_name} — what did you actually see?</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="cc-obs">Observation notes</Label>
                <Textarea id="cc-obs" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific and descriptive beats evaluative. What happened, who did what." />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAdvancing(null)}>Cancel</Button>
                <Button onClick={() => submitAdvance()} disabled={saving || isUpdating}>Save, move to feedback</Button>
              </DialogFooter>
            </>
          )}
          {advancing?.stage === "feedback" && (
            <>
              <DialogHeader>
                <DialogTitle>Feedback + one next step</DialogTitle>
                <DialogDescription>
                  {advancing.member_name} — one agreed next step beats five suggested ones. It becomes a commitment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="cc-fb">Feedback conversation notes</Label>
                  <Textarea id="cc-fb" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-next">The one next step</Label>
                  <Input id="cc-next" value={nextStep} onChange={(e) => setNextStep(e.target.value)}
                    placeholder="e.g. Post and narrate the rotation timer for one week" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-date">Follow-up date</Label>
                  <Input id="cc-date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAdvancing(null)}>Cancel</Button>
                <Button onClick={() => submitAdvance()} disabled={saving || isUpdating}>
                  {saving ? "Saving..." : "Save, schedule follow-up"}
                </Button>
              </DialogFooter>
            </>
          )}
          {advancing?.stage === "follow_up" && (
            <>
              <DialogHeader>
                <DialogTitle>Close the cycle</DialogTitle>
                <DialogDescription>
                  {advancing.member_name}
                  {advancing.next_step ? ` — did "${advancing.next_step}" move the practice?` : " — did the practice move?"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 py-3">
                <Button variant="outline" disabled={saving || isUpdating} onClick={() => submitAdvance("moved")}>Moved</Button>
                <Button variant="outline" disabled={saving || isUpdating} onClick={() => submitAdvance("partly")}>Partly</Button>
                <Button variant="outline" disabled={saving || isUpdating} onClick={() => submitAdvance("not_yet")}>Not yet</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Not yet is honest data, not failure. Consider starting a fresh cycle with a smaller next step.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
