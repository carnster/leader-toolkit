import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Activity, Check, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { usePulseCheckins, type UsedStatus } from "@/hooks/usePulseCheckins";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";

const USED_OPTIONS: { value: UsedStatus; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "partly", label: "Partly" },
  { value: "not_yet", label: "Not yet" },
];
const TRACTION_LABELS = ["Struggling", "Finding my feet", "Gaining traction", "Working well"];

interface WeeklyPulseFormProps {
  initiativeId: string;
}

export function WeeklyPulseForm({ initiativeId }: WeeklyPulseFormProps) {
  const { myCheckin, submit, isSubmitting, weekOf } = usePulseCheckins(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);

  const focusIngredient = useMemo(
    () => activeIngredients.find((i: any) => i.is_core ?? i.isCore) ?? activeIngredients[0] ?? null,
    [activeIngredients]
  );

  const [used, setUsed] = useState<UsedStatus | null>(null);
  const [traction, setTraction] = useState<number | null>(null);
  const [needs, setNeeds] = useState("");
  const [editing, setEditing] = useState(false);

  // Prefill from an existing pulse this week.
  useEffect(() => {
    if (myCheckin) {
      setUsed(myCheckin.used_status);
      setTraction(myCheckin.traction);
      setNeeds(myCheckin.needs_support ?? "");
    }
  }, [myCheckin]);

  const weekLabel = format(parseISO(weekOf), "MMM d");
  const submitted = !!myCheckin && !editing;

  const handleSend = async () => {
    if (!used || !traction) return;
    try {
      await submit({
        used_status: used,
        traction,
        needs_support: needs,
        focus_ingredient_id: focusIngredient?.id ?? null,
      });
      setEditing(false);
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <Card className="border-[hsl(var(--stage-implement))]/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[hsl(var(--stage-implement))]" aria-hidden="true" />
            <CardTitle className="text-lg">Your weekly pulse</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground font-medium">Week of {weekLabel}</span>
        </div>
        <CardDescription>
          Ninety seconds on how the work is going. Your leader sees what you need, not a grade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 max-w-md">
        {focusIngredient && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">This week&rsquo;s focus practice</p>
            <Badge variant="secondary">{focusIngredient.name}</Badge>
          </div>
        )}

        {submitted ? (
          <div className="rounded-lg border border-[hsl(var(--stage-sustain))]/40 bg-[hsl(var(--stage-sustain))]/5 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-[hsl(var(--stage-sustain))]" aria-hidden="true" />
              Pulse sent for this week
            </p>
            <p className="text-sm text-muted-foreground">
              You marked <strong>{USED_OPTIONS.find((o) => o.value === myCheckin!.used_status)?.label}</strong>,
              traction <strong>{TRACTION_LABELS[myCheckin!.traction - 1]}</strong>.
              {myCheckin!.needs_support ? ` You asked: "${myCheckin!.needs_support}"` : ""}
            </p>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit this week</Button>
          </div>
        ) : (
          <>
            {/* Q1 */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Did you use it this week?</legend>
              <div className="flex rounded-lg border overflow-hidden">
                {USED_OPTIONS.map((o, i) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setUsed(o.value)}
                    className={`flex-1 text-sm py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      i > 0 ? "border-l" : ""
                    } ${used === o.value ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted/50"}`}
                    aria-pressed={used === o.value}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Q2 */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">How is it landing?</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTraction(n)}
                    aria-label={TRACTION_LABELS[n - 1]}
                    aria-pressed={traction === n}
                    className={`flex-1 h-11 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      traction === n
                        ? "border-[hsl(var(--stage-implement))] bg-[hsl(var(--stage-implement))]/10 text-[hsl(var(--stage-implement))] font-semibold"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Struggling</span><span>Working well</span>
              </div>
            </fieldset>

            {/* Q3 */}
            <div className="space-y-2">
              <label htmlFor="pulse-needs" className="text-sm font-medium">Anything you need?</label>
              <Textarea
                id="pulse-needs"
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                placeholder="Need help regrouping my Tier 2 readers."
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              disabled={!used || !traction || isSubmitting}
              onClick={handleSend}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                "Send this week's pulse"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
