import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Check, Loader2 } from "lucide-react";

type UsedStatus = "yes" | "partly" | "not_yet";
const USED = [
  { value: "yes" as const, label: "Yes" },
  { value: "partly" as const, label: "Partly" },
  { value: "not_yet" as const, label: "Not yet" },
];

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-pulse-via-link`;

/** A stable, anonymous per-browser key so a repeat tap updates one row. */
function clientKeyFor(token: string): string {
  const k = `pulse-key:${token}`;
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(k, v);
  }
  return v;
}

export default function PublicPulse() {
  const { token = "" } = useParams();
  const clientKey = useMemo(() => clientKeyFor(token), [token]);

  const [used, setUsed] = useState<UsedStatus | null>(null);
  const [traction, setTraction] = useState<number | null>(null);
  const [needs, setNeeds] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done" | "closed">("form");

  const send = async () => {
    if (!used || !traction) return;
    setState("sending");
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          token,
          client_key: clientKey,
          used_status: used,
          traction,
          needs_support: needs.trim() || null,
          respondent_name: name.trim() || null,
        }),
      });
      if (res.ok) setState("done");
      else setState("closed");
    } catch {
      setState("closed");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-[hsl(var(--stage-implement))] text-white p-5">
          <span className="inline-block text-[10px] font-mono uppercase tracking-wider border border-white/40 rounded-full px-2 py-0.5">
            No login needed
          </span>
          <h1 className="text-xl font-semibold mt-3 flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" /> Weekly pulse
          </h1>
          <p className="text-sm text-white/80 mt-0.5">Ninety seconds on how the work is going this week.</p>
        </div>

        <div className="p-5">
          {state === "done" ? (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--stage-sustain))]/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-[hsl(var(--stage-sustain))]" aria-hidden="true" />
              </div>
              <h2 className="font-semibold text-lg">Thanks, your pulse is in</h2>
              <p className="text-sm text-muted-foreground">
                Your leader sees what you need, not a grade. You can close this page.
              </p>
            </div>
          ) : state === "closed" ? (
            <div className="text-center py-8 space-y-2">
              <h2 className="font-semibold text-lg">This link is closed</h2>
              <p className="text-sm text-muted-foreground">
                It may have been rotated or expired. Ask your leader for the current link.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Did you use the practice this week?</legend>
                <div className="flex rounded-lg border overflow-hidden">
                  {USED.map((o, i) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setUsed(o.value)}
                      aria-pressed={used === o.value}
                      className={`flex-1 text-sm py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        i > 0 ? "border-l" : ""
                      } ${used === o.value ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted/50"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">How is it landing?</legend>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTraction(n)}
                      aria-label={["Struggling", "Finding my feet", "Gaining traction", "Working well"][n - 1]}
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

              <div className="space-y-2">
                <label htmlFor="pp-needs" className="text-sm font-medium">Anything you need?</label>
                <Textarea id="pp-needs" value={needs} onChange={(e) => setNeeds(e.target.value)} rows={2}
                  placeholder="What would help you most this week?" />
              </div>

              <div className="space-y-2">
                <label htmlFor="pp-name" className="text-sm font-medium">
                  Your name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  id="pp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Leave blank to stay anonymous"
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <Button className="w-full" disabled={!used || !traction || state === "sending"} onClick={send}>
                {state === "sending" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  "Send my pulse"
                )}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Goes only to your school&rsquo;s leader for this initiative.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
