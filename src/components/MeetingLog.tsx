import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Plus, Handshake, Users, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface MeetingLogProps {
  initiativeId: string;
  rosterNames: string[];
}

interface TeamMeeting {
  id: string;
  meeting_date: string;
  attendees: string[];
  engage_notes: string | null;
  unite_notes: string | null;
  reflect_notes: string | null;
  decisions: string | null;
}

export function MeetingLog({ initiativeId, rosterNames }: MeetingLogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    meeting_date: new Date().toISOString().slice(0, 10),
    attendees: rosterNames.join(", "),
    engage_notes: "",
    unite_notes: "",
    reflect_notes: "",
    decisions: "",
  });

  const { data: meetings } = useQuery({
    queryKey: ["team-meetings", initiativeId],
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_meetings" as any)
        .select("*")
        .eq("initiative_id", initiativeId)
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data as unknown as TeamMeeting[]) || [];
    },
  });

  const logMeeting = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_meetings" as any).insert({
        initiative_id: initiativeId,
        meeting_date: form.meeting_date,
        attendees: form.attendees.split(",").map((s) => s.trim()).filter(Boolean),
        engage_notes: form.engage_notes || null,
        unite_notes: form.unite_notes || null,
        reflect_notes: form.reflect_notes || null,
        decisions: form.decisions || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-meetings", initiativeId] });
      toast({ title: "Meeting logged" });
      setOpen(false);
      setForm((f) => ({ ...f, engage_notes: "", unite_notes: "", reflect_notes: "", decisions: "" }));
    },
    onError: (e: Error) => toast({ title: "Could not log meeting", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Meeting Log</CardTitle>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Meeting
          </Button>
        </div>
        <CardDescription>
          The protocol made practical: every meeting captures what was heard, what was decided
          with owners, and what the team will do differently.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(meetings || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No meetings logged yet. The next time this team meets, capture it here:
            ten minutes of logging saves a semester of "what did we decide?"
          </p>
        ) : (
          meetings!.map((m) => (
            <div key={m.id} className="rounded-lg border p-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-medium">{format(new Date(m.meeting_date + "T12:00:00"), "PPP")}</span>
                <span className="text-xs text-muted-foreground">{m.attendees.join(", ")}</span>
              </div>
              {m.decisions && <p><span className="font-medium">Decisions:</span> {m.decisions}</p>}
              {m.engage_notes && <p className="text-muted-foreground"><Handshake className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />Engage: {m.engage_notes}</p>}
              {m.unite_notes && <p className="text-muted-foreground"><Users className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />Unite: {m.unite_notes}</p>}
              {m.reflect_notes && <p className="text-muted-foreground"><RefreshCw className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />Reflect: {m.reflect_notes}</p>}
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log a Team Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="m-date">Date</Label>
                <Input id="m-date" type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-att">Attendees</Label>
                <Input id="m-att" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="Names, comma separated" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-dec">Decisions made (with owners)</Label>
              <Textarea id="m-dec" rows={2} value={form.decisions} onChange={(e) => setForm({ ...form, decisions: e.target.value })}
                placeholder="Example: Move intervention block to Tuesdays (owner: Maria); pause new PD until February (owner: David)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-eng">Engage: what did we hear from implementers, students, or families?</Label>
              <Textarea id="m-eng" rows={2} value={form.engage_notes} onChange={(e) => setForm({ ...form, engage_notes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-uni">Unite: is the team still aligned on the why and the what?</Label>
              <Textarea id="m-uni" rows={2} value={form.unite_notes} onChange={(e) => setForm({ ...form, unite_notes: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-ref">Reflect: what does the data say, and what will we do differently?</Label>
              <Textarea id="m-ref" rows={2} value={form.reflect_notes} onChange={(e) => setForm({ ...form, reflect_notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => logMeeting.mutate()} disabled={logMeeting.isPending}>
                {logMeeting.isPending ? "Saving..." : "Log Meeting"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
