import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LearningPlanData, LearningPlanSession } from "@/hooks/useLearningPlans";

interface SessionEditDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: LearningPlanData;
  periodIndex: number;
  sessionIndex: number;
  onSave: (next: LearningPlanData) => Promise<void> | void;
  saving?: boolean;
}

export function SessionEditDialog({ open, onOpenChange, plan, periodIndex, sessionIndex, onSave, saving }: SessionEditDialogProps) {
  const original = plan.periods[periodIndex]?.sessions[sessionIndex];
  const [draft, setDraft] = useState<LearningPlanSession | null>(original ?? null);
  const [targetPeriod, setTargetPeriod] = useState(String(periodIndex));

  useEffect(() => {
    setDraft(original ?? null);
    setTargetPeriod(String(periodIndex));
  }, [original, periodIndex, open]);

  if (!draft) return null;

  const save = async () => {
    const periods = plan.periods.map((p) => ({ ...p, sessions: [...p.sessions] }));
    periods[periodIndex].sessions.splice(sessionIndex, 1);
    const dest = Number(targetPeriod);
    periods[dest].sessions.push({ ...draft, locked: true });
    await onSave({ ...plan, periods });
    onOpenChange(false);
  };

  const remove = async () => {
    const periods = plan.periods.map((p) => ({ ...p, sessions: [...p.sessions] }));
    periods[periodIndex].sessions.splice(sessionIndex, 1);
    await onSave({ ...plan, periods });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit this session</DialogTitle>
          <DialogDescription>Your edits are kept when the plan is rebuilt.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="s-title">Title</Label>
            <Input id="s-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="s-audience">Who</Label>
              <Input id="s-audience" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-modality">Format</Label>
              <Input id="s-modality" value={draft.modality} onChange={(e) => setDraft({ ...draft, modality: e.target.value })} placeholder="Workshop, coaching, PLC, self-paced" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="s-cadence">Cadence</Label>
              <Input id="s-cadence" value={draft.cadence ?? ""} onChange={(e) => setDraft({ ...draft, cadence: e.target.value })} placeholder="Once, monthly, every other week" />
            </div>
            <div className="space-y-1">
              <Label>When</Label>
              <Select value={targetPeriod} onValueChange={setTargetPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plan.periods.map((p, i) => (
                    <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-capability">What it builds</Label>
            <Input id="s-capability" value={draft.capability} onChange={(e) => setDraft({ ...draft, capability: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="s-rationale">Why this, now</Label>
            <Textarea id="s-rationale" rows={3} value={draft.rationale ?? ""} onChange={(e) => setDraft({ ...draft, rationale: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" className="text-destructive" onClick={remove} disabled={saving}>Remove session</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !draft.title.trim()}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
