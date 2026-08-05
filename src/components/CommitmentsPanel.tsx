import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Plus, Circle, CheckCircle2, RotateCcw } from "lucide-react";
import { useCommitments, type Commitment } from "@/hooks/useCommitments";
import { useTeamMembers } from "@/hooks/useTeamMembers";

const SOURCE_LABEL: Record<Commitment["source"], string> = {
  manual: "Manual",
  pulse: "Pulse flag",
  observation: "Observation",
  coaching: "Coaching",
  meeting: "Meeting",
};

function isOverdue(c: Commitment): boolean {
  return !!c.due_date && c.status === "open" && c.due_date < new Date().toISOString().slice(0, 10);
}

export function CommitmentsPanel({ initiativeId }: { initiativeId: string | undefined }) {
  const { commitments, open, isLoading, missingTable, create, isCreating, setStatus } = useCommitments(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [ownerId, setOwnerId] = useState<string>("none");
  const [dueDate, setDueDate] = useState("");

  if (missingTable) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Commitments needs a database update before it can turn support flags and follow-ups into a tracked list.
        </CardContent>
      </Card>
    );
  }

  const recentDone = commitments.filter((c) => c.status !== "open").slice(0, 3);

  const submit = () => {
    if (!title.trim()) return;
    const member = teamMembers.find((m: any) => m.id === ownerId);
    create({
      title,
      details: details || null,
      owner_member_id: member?.id || null,
      owner_name: member?.name || null,
      due_date: dueDate || null,
    });
    setTitle(""); setDetails(""); setOwnerId("none"); setDueDate("");
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
              Commitments
            </CardTitle>
            <CardDescription className="mt-1">
              Every support flag, observation follow-up, and coaching next step lands here until someone closes it.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading commitments...</p>
        ) : open.length === 0 && recentDone.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing open. Log commitments from pulse flags below, from observations, or add one here.
          </p>
        ) : (
          <>
            {open.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border p-3">
                <button
                  type="button"
                  aria-label="Mark done"
                  title="Mark done"
                  onClick={() => setStatus({ id: c.id, status: "done" })}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.title}</p>
                  {c.details && <p className="text-xs text-muted-foreground mt-0.5">{c.details}</p>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{SOURCE_LABEL[c.source]}</Badge>
                    {c.owner_name && <span className="text-xs text-muted-foreground">{c.owner_name}</span>}
                    {c.due_date && (
                      <span className={`text-xs ${isOverdue(c) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {isOverdue(c) ? "Overdue: " : "Due "}{c.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {recentDone.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-dashed p-3 opacity-70">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm line-through">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.status === "done" ? "Done" : "Dropped"}</p>
                </div>
                <Button variant="ghost" size="sm" aria-label="Reopen" onClick={() => setStatus({ id: c.id, status: "open" })}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a commitment</DialogTitle>
            <DialogDescription>One owner, one due date, closed when it is actually done.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cm-title">What will happen</Label>
              <Input id="cm-title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Model small-group rotations in Rm 204" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cm-details">Details (optional)</Label>
              <Textarea id="cm-details" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {teamMembers.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cm-due">Due date</Label>
                <Input id="cm-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!title.trim() || isCreating}>
              {isCreating ? "Saving..." : "Add commitment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
