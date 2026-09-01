import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useInitiativeTemplates } from "@/hooks/useInitiativeTemplates";

interface MandateBriefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The compressed intake for a district-directed initiative (Fast Track).
 *
 * The premise: the district already made the decision and set the clock, so we
 * do not re-run the Decide stage. We capture only what the school needs to
 * implement it well, then import the CORE active ingredients immediately so the
 * "if you do only these, do these" list is on screen from minute one. We record
 * the district's rationale as stated, without treating it as validated.
 */
export function MandateBriefDialog({ open, onOpenChange }: MandateBriefDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createInitiative, isCreating } = useInitiatives();
  const { templates } = useInitiativeTemplates();

  // Sentinel value for "the mandated practice is not in our library."
  const OTHER = "__other__";

  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [otherPractice, setOtherPractice] = useState("");
  const [rationale, setRationale] = useState("");
  const [deadline, setDeadline] = useState("");
  const [nonnegotiables, setNonnegotiables] = useState("");
  const [importing, setImporting] = useState(false);

  const isOther = templateId === OTHER;

  const categories = useMemo(() => {
    const set = new Set(templates.map((t) => t.category));
    return Array.from(set).sort();
  }, [templates]);

  const chosen = templates.find((t) => t.id === templateId);
  const coreCount = useMemo(() => {
    if (!chosen?.active_ingredients) return 0;
    const list = Array.isArray(chosen.active_ingredients) ? chosen.active_ingredients : [];
    return list.filter((i: any) => i?.is_core).length;
  }, [chosen]);

  const reset = () => {
    setTitle("");
    setTemplateId("");
    setOtherPractice("");
    setRationale("");
    setDeadline("");
    setNonnegotiables("");
  };

  // A practice is chosen either from the library (a real template) or typed in
  // as "Other". Both are valid; Other simply skips the import and lets the
  // school author its own core practices on the Fast Track page.
  const practiceName = isOther ? otherPractice.trim() : chosen?.name || "";
  const canSubmit =
    title.trim() &&
    (isOther ? otherPractice.trim() : !!chosen) &&
    !isCreating &&
    !importing;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const list = nonnegotiables
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    createInitiative(
      {
        title: title.trim(),
        description: rationale.trim() || null,
        stage: "decide",
        status: "active",
        mode: "fast_track",
        target_end_date: deadline || null,
        mandate: {
          practice: practiceName,
          rationale: rationale.trim(),
          nonnegotiables: list,
        },
      },
      {
        onSuccess: async (created: any) => {
          const id = created?.id;
          if (!id) {
            onOpenChange(false);
            return;
          }
          setImporting(true);
          try {
            // Library path: import ONLY the core ingredients. This is the hard
            // floor and the whole point of Fast Track: the practices that, if
            // dropped, mean the mandate was not actually implemented. Other
            // path: nothing to import; the school authors core practices on the
            // Fast Track page, where the same floor is enforced.
            let coreCountLoaded = 0;
            if (!isOther && chosen) {
              const all = Array.isArray(chosen.active_ingredients)
                ? chosen.active_ingredients
                : [];
              const core = all
                .filter((ing: any) => ing?.is_core)
                .map((ing: any) => ({
                  initiative_id: id,
                  name: ing.name,
                  description: ing.description ?? null,
                  is_core: true,
                  category: ing.category ?? null,
                  look_fors: ing.look_fors ?? null,
                  adaptable_boundaries: ing.adaptable_boundaries ?? null,
                }));
              if (core.length) {
                const { error } = await supabase.from("active_ingredients").insert(core);
                if (error) throw error;
                coreCountLoaded = core.length;
              }
            }

            // Best-effort: seed a coherent decision brief so the initiative is
            // not empty if the school later expands to the full build. Non-fatal
            // if it fails; the core flow does not depend on it.
            try {
              const tBrief = (chosen?.decision_brief_template as any) || {};
              await supabase.from("decision_briefs").insert({
                initiative_id: id,
                problem_statement: `District-directed initiative: ${practiceName}.` +
                  (rationale.trim() ? ` District rationale: ${rationale.trim()}` : ""),
                target_group: tBrief.target_group || null,
                chosen_approach: practiceName,
                evidence_base: chosen?.evidence_base || null,
              });
            } catch {
              /* brief seed is optional */
            }

            try {
              sessionStorage.setItem("initiativeId", id);
            } catch {
              /* private mode or storage disabled; the URL param still carries context */
            }

            toast({
              title: "Fast Track started",
              description: coreCountLoaded
                ? `${coreCountLoaded} core practice${coreCountLoaded === 1 ? "" : "s"} loaded.`
                : "Add your core practices on the next screen.",
            });
            reset();
            onOpenChange(false);
            navigate(`/fast-track?initiative=${id}`);
          } catch (e: any) {
            toast({
              title: "Created, but core practices did not load",
              description: e?.message || "Open the initiative and try again from Fast Track.",
              variant: "destructive",
            });
            reset();
            onOpenChange(false);
            navigate(`/fast-track?initiative=${id}`);
          } finally {
            setImporting(false);
          }
        },
      }
    );
  };

  const busy = isCreating || importing;

  return (
    <Dialog open={open} onOpenChange={(o) => (busy ? null : onOpenChange(o))}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" aria-hidden="true" />
            District Initiative (Fast Track)
          </DialogTitle>
          <DialogDescription>
            The district made the call and set the clock. This captures only what you need to
            implement it well, then loads the core practices right away. The full process is always
            here when you have the capacity for it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="mandate-title">Initiative name</Label>
            <Input
              id="mandate-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. District MTSS rollout"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mandate-practice">Mandated practice</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="mandate-practice">
                <SelectValue placeholder="Pick the practice the district handed down" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>{cat}</SelectLabel>
                    {templates
                      .filter((t) => t.category === cat)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                ))}
                <SelectGroup>
                  <SelectLabel>Not in the library</SelectLabel>
                  <SelectItem value={OTHER}>Other — not in the library</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {isOther ? (
              <div className="space-y-1.5 pt-1">
                <Input
                  value={otherPractice}
                  onChange={(e) => setOtherPractice(e.target.value)}
                  placeholder="Name the practice the district mandated"
                />
                <p className="text-xs text-muted-foreground">
                  No template for this one, so you will name its core practices on the next screen.
                </p>
              </div>
            ) : (
              chosen && (
                <p className="text-xs text-muted-foreground">
                  Loads {coreCount} core practice{coreCount === 1 ? "" : "s"} with their look-fors.
                </p>
              )
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mandate-rationale">Why the district says (as stated)</Label>
            <Textarea
              id="mandate-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Record the district's stated reason. You are recording it, not endorsing it."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mandate-deadline">Deadline</Label>
              <Input
                id="mandate-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mandate-nonneg">Non-negotiables the district imposed</Label>
            <Textarea
              id="mandate-nonneg"
              value={nonnegotiables}
              onChange={(e) => setNonnegotiables(e.target.value)}
              placeholder={"One per line.\ne.g. Every teacher trained by October\ne.g. Weekly data submitted to the district"}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {busy ? "Starting..." : "Start Fast Track"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
